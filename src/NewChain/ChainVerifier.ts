import { Contracts as MosaicContracts, AbiBinProvider } from '@openst/mosaic.js';

import MosaicConfig, { ContractAddresses } from '../Config/MosaicConfig';

import Logger from '../Logger';

import Web3 = require('web3');

/**
 * Chain verifier does verification of newly created auxiliary chains.
 */
export default class ChainVerifier {
  private originWeb3: Web3;

  private auxiliaryWeb3: Web3;

  private mosaicConfig: MosaicConfig;

  private mosaicContract: MosaicContracts;

  private contractAddresses: ContractAddresses;

  private abiBinProvider: AbiBinProvider;

  /**
   * ChainVerifier constructor.
   *
   * @param {string} originWebSocket origin chain web3 endpoint.
   * @param {string} auxiliaryWebSocket auxiliary chain web3 endpoint.
   * @param {string} originChain Origin chain identifier.
   * @param {string} auxiliaryChainId Auxiliary chain id.
   */
  public constructor(
    private originWebSocket: string,
    private auxiliaryWebSocket: string,
    private originChain: string,
    private auxiliaryChainId: string,
  ) {
    this.originWeb3 = new Web3(originWebSocket);
    this.auxiliaryWeb3 = new Web3(auxiliaryWebSocket);
    this.mosaicConfig = MosaicConfig.from(originChain);
    this.mosaicContract = new MosaicContracts(this.originWeb3, this.auxiliaryWeb3);
    this.contractAddresses = this.mosaicConfig.auxiliaryChains[this.auxiliaryChainId].contractAddresses;
    this.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Public method verify which encapsulates chain verification logic.
   *
   * @returns {Promise<void>}
   */
  public async verify(): Promise<void> {
    Logger.info("Starting chain verification!!!");
      await this.verifyContractsBin();
      await this.verifyGateway();
      await this.verifyCoGateway();
      await this.verifyOriginAnchor();
      await this.verifyAuxiliaryAnchor();
      await this.verifyOSTPrime();
    Logger.info("Successfully completed chain verification!!!");
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
    console.log("deployedGatewayBin:", deployedGatewayBin);
    console.log("this.abiBinProvider.getBIN('EIP20Gateway'):", this.abiBinProvider.getBIN('EIP20Gateway'));
    if (deployedGatewayBin !== this.abiBinProvider.getBIN('EIP20Gateway')) {
      throw new Error('ContractsBin: Mismatch of Gateway BIN!!!');
    }

    const deployedCoGatewayBin = await this.auxiliaryWeb3.eth.getCode(
      this.contractAddresses.auxiliary.ostEIP20CogatewayAddress,
    );
    if (deployedCoGatewayBin !== this.abiBinProvider.getBIN('EIP20CoGateway')) {
      throw new Error('ContractsBin: Mismatch of CoGateway BIN!!!');
    }

    const deployedAnchorBin = await this.originWeb3.eth.getCode(
      this.contractAddresses.origin.anchorAddress,
    );
    if (deployedAnchorBin !== this.abiBinProvider.getBIN('Anchor')) {
      throw new Error('ContractsBin: Mismatch of Anchor BIN!!!');
    }

    const deployedOrganizationBin = await this.originWeb3.eth.getCode(
      this.contractAddresses.origin.ostGatewayOrganizationAddress,
    );
    if (deployedOrganizationBin !== this.abiBinProvider.getBIN('Organization')) {
      throw new Error('ContractsBin: Mismatch of Organization BIN!!!');
    }

    const deployedOstPrimeBin = await this.auxiliaryWeb3.eth.getCode(
      this.contractAddresses.auxiliary.ostPrimeAddress,
    );
    if (deployedOstPrimeBin !== this.abiBinProvider.getBIN('OSTPrime')) {
      throw new Error('ContractsBin: Mismatch of OSTPrime BIN!!!');
    }
    Logger.info("Successfully completed contracts BIN verification!!!");
  }

  /**
   * This method does verification of Gateway storage data.
   *
   * @returns {Promise<void>}
   */
  private async verifyGateway(): Promise<void> {
    const gatewayInstance = this.mosaicContract.EIP20Gateway(
      this.contractAddresses.origin.ostEIP20GatewayAddress,
    );

    const isActivated = await gatewayInstance.methods.activated().call();
    if (isActivated !== true) {
      throw new Error('Gateway: It should be activated!!!');
    }
    const valueToken = await gatewayInstance.methods.token().call();
    if (this.originWeb3.utils.toChecksumAddress(valueToken) !==
        this.originWeb3.utils.toChecksumAddress(this.mosaicConfig.originChain.contractAddresses.simpleTokenAddress)) {
      throw new Error('Gateway: Invalid valueToken address!!!');
    }
    const baseToken = await gatewayInstance.methods.baseToken().call();
    if (this.originWeb3.utils.toChecksumAddress(baseToken) !==
      this.originWeb3.utils.toChecksumAddress(this.mosaicConfig.originChain.contractAddresses.simpleTokenAddress)) {
      throw new Error('Gateway: Invalid baseToken address!!!');
    }
    // Verify organization address
    const organization = await gatewayInstance.methods.organization().call();
    if (this.originWeb3.utils.toChecksumAddress(organization) !==
      this.originWeb3.utils.toChecksumAddress(this.contractAddresses.origin.ostGatewayOrganizationAddress)) {
      throw new Error('Gateway: Invalid gateway organization address!!!');
    }
    const remoteGateway = await gatewayInstance.methods.remoteGateway().call();
    if (this.originWeb3.utils.toChecksumAddress(remoteGateway) !==
      this.originWeb3.utils.toChecksumAddress(this.contractAddresses.auxiliary.ostEIP20CogatewayAddress)) {
      throw new Error('Gateway: Invalid CoGateway address!!!');
    }
    const stateRootProvider = await gatewayInstance.methods.stateRootProvider().call();
    if (this.originWeb3.utils.toChecksumAddress(stateRootProvider) !==
      this.originWeb3.utils.toChecksumAddress(this.contractAddresses.origin.anchorAddress)) {
      throw new Error('Gateway: Invalid stateRootProvider!!!');
    }
    Logger.info("Successfully completed gateway contract verification!!!");
  }

  /**
   * This method does verification of CoGateway state data.
   *
   * @returns {Promise<void>}
   */
  private async verifyCoGateway(): Promise<void> {
    const coGatewayInstance = this.mosaicContract.EIP20CoGateway(
      this.contractAddresses.auxiliary.ostEIP20CogatewayAddress,
    );
    const valueToken = await coGatewayInstance.methods.valueToken().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(valueToken) !==
      this.auxiliaryWeb3.utils.toChecksumAddress(this.mosaicConfig.originChain.contractAddresses.simpleTokenAddress)) {
      throw new Error('CoGateway: Invalid valueToken address!!!');
    }
    const utilityToken = await coGatewayInstance.methods.utilityToken().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(utilityToken) !==
      this.auxiliaryWeb3.utils.toChecksumAddress(this.contractAddresses.auxiliary.ostPrimeAddress)) {
      throw new Error('CoGateway: Invalid OSTPrime address!!!');
    }
    const organization = await coGatewayInstance.methods.organization().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(organization) !==
      this.auxiliaryWeb3.utils.toChecksumAddress(this.contractAddresses.auxiliary.ostCoGatewayOrganizationAddress)) {
      throw new Error('CoGateway: Invalid organization address!!!');
    }
    const remoteGateway = await coGatewayInstance.methods.remoteGateway().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(remoteGateway) !==
      this.auxiliaryWeb3.utils.toChecksumAddress(this.contractAddresses.origin.ostEIP20GatewayAddress)) {
      throw new Error('CoGateway: Invalid remoteGateway address!!!');
    }
    const stateRootProvider = await coGatewayInstance.methods.stateRootProvider().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(stateRootProvider) !==
      this.auxiliaryWeb3.utils.toChecksumAddress(this.contractAddresses.auxiliary.anchorAddress)) {
      throw new Error('CoGateway: Invalid stateRootProvider!!!');
    }
    Logger.info("Successfully completed CoGateway contract verification!!!");
  }

  /**
   * This method does verification of origin Anchor contract state data.
   *
   * @returns {Promise<void>}
   */
  private async verifyOriginAnchor(): Promise<void> {
    const anchorInstance = this.mosaicContract.OriginAnchor(
      this.contractAddresses.origin.anchorAddress,
    );
    const coAnchor = await anchorInstance.methods.coAnchor().call();
    if (this.originWeb3.utils.toChecksumAddress(coAnchor) !==
      this.originWeb3.utils.toChecksumAddress(this.contractAddresses.auxiliary.anchorAddress)) {
      throw new Error('OriginAnchor: Invalid coAnchor address!!!');
    }
    const organization = await anchorInstance.methods.organization().call();
    if (this.originWeb3.utils.toChecksumAddress(organization) !==
      this.originWeb3.utils.toChecksumAddress(this.contractAddresses.origin.anchorOrganizationAddress)) {
      throw new Error('OriginAnchor: Invalid organization address!!!');
    }
    const remoteChainId = await anchorInstance.methods.getRemoteChainId().call();
    if (remoteChainId !== this.auxiliaryChainId) {
      throw new Error('OriginAnchor: Invalid remoteChainId!!!');
    }
    Logger.info("Successfully completed origin Anchor contract verification!!!");
  }

  /**
   * This method does verification of auxiliary Anchor contract state data.
   *
   * @returns {Promise<void>}
   */
  private async verifyAuxiliaryAnchor(): Promise<void> {
    const anchorInstance = this.mosaicContract.AuxiliaryAnchor(
      this.contractAddresses.auxiliary.anchorAddress,
    );
    const coAnchor = await anchorInstance.methods.coAnchor().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(coAnchor) !==
      this.auxiliaryWeb3.utils.toChecksumAddress(this.contractAddresses.origin.anchorAddress)) {
      throw new Error('AuxiliaryAnchor: Invalid coAnchor address!!!');
    }
    const organization = await anchorInstance.methods.organization().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(organization) !==
      this.auxiliaryWeb3.utils.toChecksumAddress(this.contractAddresses.auxiliary.anchorOrganizationAddress)) {
      throw new Error('AuxiliaryAnchor: Invalid organization address!!!');
    }
    const remoteChainId = await anchorInstance.methods.getRemoteChainId().call();
    if (remoteChainId !== this.mosaicConfig.originChain.chain) {
      throw new Error('AuxiliaryAnchor: Invalid remoteChainId!!!');
    }
    Logger.info("Successfully completed auxiliary Anchor contract verification!!!");
  }

  /**
   * This method does verification of OSTPrime contract state data.
   *
   * @returns {Promise<void>}
   */
  private async verifyOSTPrime(): Promise<void> {
    const ostPrimeInstance = this.mosaicContract.OSTPrime(
      this.contractAddresses.auxiliary.ostPrimeAddress,
    );
    const valueToken = await ostPrimeInstance.methods.token().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(valueToken) !==
      this.auxiliaryWeb3.utils.toChecksumAddress(this.mosaicConfig.originChain.contractAddresses.simpleTokenAddress)) {
      throw new Error('OSTPrime: Invalid OSTPrime address!!!');
    }
    const initialized = await ostPrimeInstance.methods.initialized().call();
    if (initialized !== true) {
      throw new Error('OSTPrime: Invalid initialized value!!!');
    }
    const organization = await ostPrimeInstance.methods.organization().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(organization) !==
      this.auxiliaryWeb3.utils.toChecksumAddress(this.contractAddresses.auxiliary.ostCoGatewayOrganizationAddress)) {
      throw new Error('OSTPrime: Invalid organization address!!!');
    }
    const coGateway = await ostPrimeInstance.methods.coGateway().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(coGateway) !==
      this.auxiliaryWeb3.utils.toChecksumAddress(this.contractAddresses.auxiliary.ostEIP20CogatewayAddress)) {
      throw new Error('OSTPrime: Invalid coGateway address!!!');
    }
    Logger.info("Successfully completed OSTPrime contract verification!!!");
  }
}
