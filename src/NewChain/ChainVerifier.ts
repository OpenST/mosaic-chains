import Web3 = require('web3');
import { ContractInteract, Contracts as MosaicContracts, AbiBinProvider } from '@openst/mosaic.js';

import MosaicConfig, {ContractAddresses} from "../Config/MosaicConfig";

/**
 * Chain verifier does verification of newly created auxiliary chains.
 */
export default class ChainVerifier {

  private originWeb3: Web3;

  private auxiliaryWeb3: Web3;

  private mosaicConfig: MosaicConfig;

  private mosaicContractInstance: MosaicContracts;

  private contractAddresses: ContractAddresses;

  private abiBinProvider: AbiBinProvider;

  /**
   * ChainVerifier constructor.
   *
   * @param {string} originWebSocket origin chain web3 endpoint.
   * @param {string} auxiliaryWebSocket auxiliary chain web3 endpoint.
   * @param {string} chainId auxiliary chain id.
   */
  constructor(
    private originWebSocket: string,
    private auxiliaryWebSocket: string,
    private chainId: string,
  ) {
    this.originWeb3 = new Web3(originWebSocket);
    this.auxiliaryWeb3 = new Web3(auxiliaryWebSocket);
    this.mosaicConfig =  MosaicConfig.from(chainId);
    this.mosaicContractInstance = new MosaicContracts(this.originWeb3, this.auxiliaryWeb3);
    this.contractAddresses = this.mosaicConfig.auxiliaryChains[this.chainId].contractAddresses;
    this.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Public method verify which encapsulates chain verification logic.
   *
   * @returns {Promise<void>}
   */
  public async verify(): Promise<void> {
    this.verifyContractsBin();
    this.verifyGateway();
    this.verifyCoGateway();
    this.verifyOriginAnchor();
    this.verifyAuxiliaryAnchor();
    this.verifyOSTPrime();
  }

  /**
   * This method does verification of deployed contracts BIN.
   *
   * @returns {Promise<void>}
   */
  private async verifyContractsBin(): Promise<void> {
    const deployedGatewayBin = await this.originWeb3.eth.getCode(
      this.contractAddresses.origin.ostEIP20GatewayAddress,
    );
    if (deployedGatewayBin != this.abiBinProvider.getBIN("EIP20Gateway")) {
      throw new Error('ContractsBin: Mismatch of Gateway BIN!!!');
    }

    const deployedCoGatewayBin = await this.auxiliaryWeb3.eth.getCode(
      this.contractAddresses.auxiliary.ostEIP20CogatewayAddress,
    );
    if (deployedCoGatewayBin != this.abiBinProvider.getBIN("EIP20CoGateway")) {
      throw new Error('ContractsBin: Mismatch of CoGateway BIN!!!');
    }

    const deployedAnchorBin = await this.originWeb3.eth.getCode(
      this.contractAddresses.origin.anchorAddress,
    );
    if (deployedAnchorBin != this.abiBinProvider.getBIN("Anchor")) {
      throw new Error('ContractsBin: Mismatch of Anchor BIN!!!');
    }

    const deployedOrganizationBin = await this.originWeb3.eth.getCode(
      this.contractAddresses.origin.ostGatewayOrganizationAddress,
    );
    if (deployedOrganizationBin != this.abiBinProvider.getBIN("Organization")) {
      throw new Error('ContractsBin: Mismatch of Organization BIN!!!');
    }

    const deployedOstPrimeBin = await this.auxiliaryWeb3.eth.getCode(
      this.contractAddresses.auxiliary.ostPrimeAddress,
    );
    if (deployedOstPrimeBin != this.abiBinProvider.getBIN("OSTPrime")) {
      throw new Error('ContractsBin: Mismatch of OSTPrime BIN!!!');
    }
  }

  /**
   * This method does verification of Gateway storage data.
   *
   * @returns {Promise<void>}
   */
  private async verifyGateway(): Promise<void> {
    const gatewayInstance = this.mosaicContractInstance.EIP20Gateway(
      this.contractAddresses.origin.ostEIP20GatewayAddress,
    );

    const isActivated = await gatewayInstance.methods.activated().call();
    if (isActivated == false) {
      throw new Error('Gateway: It should be activated!!!');
    }
    const valueToken = await gatewayInstance.methods.valueToken().call();
    if (valueToken != this.mosaicConfig.originChain.contractAddresses.simpleTokenAddress) {
      throw new Error('Gateway: Invalid valueToken address!!!');
    }
    const baseToken = await gatewayInstance.methods.baseToken().call();
    if (baseToken != this.mosaicConfig.originChain.contractAddresses.simpleTokenAddress) {
      throw new Error('Gateway: Invalid baseToken address!!!');
    }
    // Verify organization address
    const organization = await gatewayInstance.methods.organization().call();
    if (organization != this.contractAddresses.origin.ostGatewayOrganizationAddress) {
      throw new Error('Gateway: Invalid gateway organization address!!!');
    }
    const remoteGateway = await gatewayInstance.methods.remoteGateway().call();
    if (remoteGateway != this.contractAddresses.auxiliary.ostEIP20CogatewayAddress) {
      throw new Error('Gateway: Invalid CoGateway address!!!');
    }
    const stateRootProvider = await gatewayInstance.methods.stateRootProvider().call();
    if (stateRootProvider != this.contractAddresses.origin.anchorAddress) {
      throw new Error('Gateway: Invalid stateRootProvider!!!');
    }
  }

  /**
   * This method does verification of CoGateway state data.
   *
   * @returns {Promise<void>}
   */
  private async verifyCoGateway(): Promise<void> {
    const coGatewayInstance = this.mosaicContractInstance.EIP20CoGateway(
      this.contractAddresses.auxiliary.ostEIP20CogatewayAddress
    );
    const valueToken = coGatewayInstance.methods.valueToken().call();
    if (valueToken != await this.mosaicConfig.originChain.contractAddresses.simpleTokenAddress) {
      throw new Error('CoGateway: Invalid valueToken address!!!');
    }
    const utilityToken = coGatewayInstance.methods.utilityToken().call();
    if (utilityToken != await this.contractAddresses.auxiliary.ostPrimeAddress) {
      throw new Error('CoGateway: Invalid OSTPrime address!!!');
    }
    const organization = await coGatewayInstance.methods.organization().call();
    if (organization != this.contractAddresses.auxiliary.ostCoGatewayOrganizationAddress) {
      throw new Error('CoGateway: Invalid organization address!!!');
    }
    const remoteGateway = await coGatewayInstance.methods.remoteGateway().call();
    if (remoteGateway != this.contractAddresses.origin.ostEIP20GatewayAddress) {
      throw new Error('CoGateway: Invalid remoteGateway address!!!');
    }
    const stateRootProvider = await coGatewayInstance.methods.stateRootProvider().call();
    if (stateRootProvider != this.contractAddresses.auxiliary.anchorAddress) {
      throw new Error('CoGateway: Invalid stateRootProvider!!!');
    }
  }

  /**
   * This method does verification of origin Anchor contract state data.
   *
   * @returns {Promise<void>}
   */
  private async verifyOriginAnchor(): Promise<void> {
    const anchorInstance = this.mosaicContractInstance.OriginAnchor(
      this.contractAddresses.origin.anchorAddress
    );
    const coAnchor = await anchorInstance.methods.coAnchor().call();
    if (coAnchor != this.contractAddresses.auxiliary.anchorAddress) {
      throw new Error('OriginAnchor: Invalid coAnchor address!!!');
    }
    const organization = await anchorInstance.methods.organization().call();
    if (organization != this.contractAddresses.origin.anchorOrganizationAddress) {
      throw new Error('OriginAnchor: Invalid organization address!!!');
    }
    const remoteChainId = await anchorInstance.methods.remoteChainId().call();
    if (remoteChainId != this.chainId) {
      throw new Error('OriginAnchor: Invalid remoteChainId!!!');
    }
  }

  /**
   * This method does verification of auxiliary Anchor contract state data.
   *
   * @returns {Promise<void>}
   */
  private async verifyAuxiliaryAnchor(): Promise<void> {
    const anchorInstance = this.mosaicContractInstance.AuxiliaryAnchor(
      this.contractAddresses.origin.anchorAddress,
    );
    const coAnchor = await anchorInstance.methods.coAnchor().call();
    if (coAnchor != this.contractAddresses.auxiliary.anchorAddress) {
      throw new Error('AuxiliaryAnchor: Invalid coAnchor address!!!');
    }
    const organization = await anchorInstance.methods.organization().call();
    if (organization != this.contractAddresses.auxiliary.anchorOrganizationAddress) {
      throw new Error('AuxiliaryAnchor: Invalid organization address!!!');
    }
    const remoteChainId = await anchorInstance.methods.remoteChainId().call();
    if (organization != this.mosaicConfig.originChain.chain) {
      throw new Error('AuxiliaryAnchor: Invalid remoteChainId!!!');
    }
  }

  /**
   * This method does verification of OSTPrime contract state data.
   *
   * @returns {Promise<void>}
   */
  private async verifyOSTPrime(): Promise<void> {
    const ostPrimeInstance = this.mosaicContractInstance.OSTPrime(
      this.contractAddresses.auxiliary.ostPrimeAddress,
    );
    const valueToken = await ostPrimeInstance.methods.valueToken().call();
    if (valueToken != this.mosaicConfig.originChain.contractAddresses.simpleTokenAddress) {
      throw new Error('OSTPrime: Invalid OSTPrime address!!!');
    }
    const initialized = await ostPrimeInstance.methods.initialized().call();
    if (initialized != true) {
      throw new Error('OSTPrime: Invalid initialized value!!!');
    }
    const organization = await ostPrimeInstance.methods.organization().call();
    if (organization != this.contractAddresses.auxiliary.ostCoGatewayOrganizationAddress) {
      throw new Error('OSTPrime: Invalid organization address!!!');
    }
    const coGateway = await ostPrimeInstance.methods.coGateway().call();
    if (coGateway != this.contractAddresses.auxiliary.ostEIP20CogatewayAddress) {
      throw new Error('OSTPrime: Invalid coGateway address!!!');
    }
  }

}
