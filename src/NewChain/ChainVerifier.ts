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

  private originChainIdentifier: string;

  private auxiliaryChainId: string;

  private mosaicConfig: MosaicConfig;

  private mosaicContract: MosaicContracts;

  private contractAddresses: ContractAddresses;

  private abiBinProvider: AbiBinProvider;

  /**
   * ChainVerifier constructor.
   *
   * @param {string} originWebSocket Origin chain web3 endpoint.
   * @param {string} auxiliaryWebSocket Auxiliary chain web3 endpoint.
   * @param {string} originChainIdentifier Origin chain identifier.
   * @param {string} auxiliaryChainId Auxiliary chain id.
   */
  public constructor(
    originWebSocket: string,
    auxiliaryWebSocket: string,
    originChainIdentifier: string,
    auxiliaryChainId: string,
  ) {
    this.originWeb3 = new Web3(originWebSocket);
    this.auxiliaryWeb3 = new Web3(auxiliaryWebSocket);
    this.originChainIdentifier = originChainIdentifier;
    this.auxiliaryChainId = auxiliaryChainId;
    this.mosaicConfig = MosaicConfig.from(this.originChainIdentifier);
    this.mosaicContract = new MosaicContracts(this.originWeb3, this.auxiliaryWeb3);
    this.contractAddresses = this.mosaicConfig.auxiliaryChains[this.auxiliaryChainId]
      .contractAddresses;
    this.abiBinProvider = new AbiBinProvider();
  }

  /**
   * Public method verify which encapsulates chain verification logic.
   *
   * @returns {Promise<void>}
   */
  public async verify(): Promise<void> {
    Logger.info('Starting chain verification!!!');

    await this.verifyContractsBin();
    await this.verifyGateway();
    await this.verifyCoGateway();
    await this.verifyOriginAnchor();
    await this.verifyAuxiliaryAnchor();
    await this.verifyOSTPrime();

    Logger.info('Successfully completed chain verification!!!');
  }

  /**
   * This method does verification of deployed contracts BIN.
   * Note: Runtime bytecode is what's actually stored at the contract address.
   * It doesn't include the constructor function or initialization code (which the bytecode does).
   * 0x is stripped and checked if runtime bytecode is substring of sent bytecode
   *
   * @returns {Promise<void>}
   */
  private async verifyContractsBin(): Promise<void> {
    const deployedGatewayBin = await this.originWeb3.eth.getCode(
      this.contractAddresses.origin.ostEIP20GatewayAddress,
    );

    const messageBusLinkInfo = {
      address: this.mosaicConfig.originChain.contractAddresses.messageBusAddress,
      name: 'MessageBus',
    };
    const gatewayLibLinkInfo = {
      address: this.mosaicConfig.originChain.contractAddresses.gatewayLibAddress,
      name: 'GatewayLib',
    };
    const gatewayLinkedBin = this.abiBinProvider.getLinkedBIN(
      'EIP20Gateway',
      messageBusLinkInfo,
      gatewayLibLinkInfo,
    );
    if (gatewayLinkedBin.toLowerCase().indexOf(deployedGatewayBin.slice(2).toLowerCase()) === -1) {
      throw new Error('ContractsBin: Mismatch of Gateway BIN!!!');
    }

    const coGatewayLinkedBin = this.abiBinProvider.getLinkedBIN(
      'EIP20CoGateway',
      messageBusLinkInfo,
      gatewayLibLinkInfo,
    );
    const deployedCoGatewayBin = await this.auxiliaryWeb3.eth.getCode(
      this.contractAddresses.auxiliary.ostEIP20CogatewayAddress,
    );
    if (coGatewayLinkedBin.toLowerCase().indexOf(
      deployedCoGatewayBin.toLowerCase().slice(2),
    ) === -1
    ) {
      throw new Error('ContractsBin: Mismatch of CoGateway BIN!!!');
    }

    const deployedOriginAnchorBin = await this.originWeb3.eth.getCode(
      this.contractAddresses.origin.anchorAddress,
    );
    if (this.abiBinProvider.getBIN('Anchor').toLowerCase().indexOf(
      deployedOriginAnchorBin.toLowerCase().slice(2),
    ) === -1
    ) {
      throw new Error('ContractsBin: Mismatch of Anchor BIN!!!');
    }

    const deployedAuxiliaryAnchorBin = await this.auxiliaryWeb3.eth.getCode(
      this.contractAddresses.auxiliary.anchorAddress,
    );
    if (this.abiBinProvider.getBIN('Anchor').toLowerCase().indexOf(
      deployedAuxiliaryAnchorBin.toLowerCase().slice(2),
    ) === -1
    ) {
      throw new Error('ContractsBin: Mismatch of Anchor BIN!!!');
    }

    const deployedOriginAnchorOrganizationBin = await this.originWeb3.eth.getCode(
      this.contractAddresses.origin.anchorOrganizationAddress,
    );
    if (this.abiBinProvider.getBIN('Organization').toLowerCase().indexOf(
      deployedOriginAnchorOrganizationBin.toLowerCase().slice(2),
    ) === -1
    ) {
      throw new Error('ContractsBin: Mismatch of Organization BIN!!!');
    }

    const deployedAuxiliaryAnchorOrganizationBin = await this.originWeb3.eth.getCode(
      this.contractAddresses.auxiliary.anchorOrganizationAddress,
    );
    if (this.abiBinProvider.getBIN('Organization').toLowerCase().indexOf(
      deployedAuxiliaryAnchorOrganizationBin.toLowerCase().slice(2),
    ) === -1
    ) {
      throw new Error('ContractsBin: Mismatch of Organization BIN!!!');
    }

    const deployedOriginOrganizationBin = await this.originWeb3.eth.getCode(
      this.contractAddresses.origin.ostGatewayOrganizationAddress,
    );
    if (this.abiBinProvider.getBIN('Organization').toLowerCase().indexOf(
      deployedOriginOrganizationBin.toLowerCase().slice(2),
    ) === -1
    ) {
      throw new Error('ContractsBin: Mismatch of Organization BIN!!!');
    }

    const deployedAuxiliaryOrganizationBin = await this.auxiliaryWeb3.eth.getCode(
      this.contractAddresses.auxiliary.ostCoGatewayOrganizationAddress,
    );
    if (this.abiBinProvider.getBIN('Organization').toLowerCase().indexOf(
      deployedAuxiliaryOrganizationBin.slice(2).toLowerCase(),
    ) === -1
    ) {
      throw new Error('ContractsBin: Mismatch of Organization BIN!!!');
    }

    const deployedOstPrimeBin = await this.auxiliaryWeb3.eth.getCode(
      this.contractAddresses.auxiliary.ostPrimeAddress,
    );
    if (this.abiBinProvider.getBIN('OSTPrime').toLowerCase().indexOf(
      deployedOstPrimeBin.slice(2).toLowerCase(),
    ) === -1
    ) {
      throw new Error('ContractsBin: Mismatch of OSTPrime BIN!!!');
    }
    Logger.info('Successfully completed contracts BIN verification!!!');
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
    if (this.originWeb3.utils.toChecksumAddress(valueToken)
        !== this.originWeb3.utils.toChecksumAddress(
          this.mosaicConfig.originChain.contractAddresses.simpleTokenAddress,
        )) {
      throw new Error('Gateway: Invalid valueToken address!!!');
    }

    const baseToken = await gatewayInstance.methods.baseToken().call();
    if (this.originWeb3.utils.toChecksumAddress(baseToken)
      !== this.originWeb3.utils.toChecksumAddress(
        this.mosaicConfig.originChain.contractAddresses.simpleTokenAddress,
      )) {
      throw new Error('Gateway: Invalid baseToken address!!!');
    }

    const organization = await gatewayInstance.methods.organization().call();
    if (this.originWeb3.utils.toChecksumAddress(organization)
      !== this.originWeb3.utils.toChecksumAddress(
        this.contractAddresses.origin.ostGatewayOrganizationAddress,
      )
    ) {
      throw new Error('Gateway: Invalid gateway organization address!!!');
    }

    const remoteGateway = await gatewayInstance.methods.remoteGateway().call();
    if (this.originWeb3.utils.toChecksumAddress(remoteGateway)
      !== this.originWeb3.utils.toChecksumAddress(
        this.contractAddresses.auxiliary.ostEIP20CogatewayAddress,
      )
    ) {
      throw new Error('Gateway: Invalid CoGateway address!!!');
    }

    const stateRootProvider = await gatewayInstance.methods.stateRootProvider().call();
    if (this.originWeb3.utils.toChecksumAddress(stateRootProvider)
      !== this.originWeb3.utils.toChecksumAddress(this.contractAddresses.origin.anchorAddress)) {
      throw new Error('Gateway: Invalid stateRootProvider!!!');
    }
    Logger.info('Successfully completed gateway contract verification!!!');
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
    if (this.auxiliaryWeb3.utils.toChecksumAddress(valueToken)
      !== this.auxiliaryWeb3.utils.toChecksumAddress(
        this.mosaicConfig.originChain.contractAddresses.simpleTokenAddress,
      )
    ) {
      throw new Error('CoGateway: Invalid valueToken address!!!');
    }

    const utilityToken = await coGatewayInstance.methods.utilityToken().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(utilityToken)
      !== this.auxiliaryWeb3.utils.toChecksumAddress(
        this.contractAddresses.auxiliary.ostPrimeAddress,
      )
    ) {
      throw new Error('CoGateway: Invalid OSTPrime address!!!');
    }

    const organization = await coGatewayInstance.methods.organization().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(organization)
      !== this.auxiliaryWeb3.utils.toChecksumAddress(
        this.contractAddresses.auxiliary.ostCoGatewayOrganizationAddress,
      )
    ) {
      throw new Error('CoGateway: Invalid organization address!!!');
    }

    const remoteGateway = await coGatewayInstance.methods.remoteGateway().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(remoteGateway)
      !== this.auxiliaryWeb3.utils.toChecksumAddress(
        this.contractAddresses.origin.ostEIP20GatewayAddress,
      )
    ) {
      throw new Error('CoGateway: Invalid remoteGateway address!!!');
    }

    const stateRootProvider = await coGatewayInstance.methods.stateRootProvider().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(stateRootProvider)
      !== this.auxiliaryWeb3.utils.toChecksumAddress(
        this.contractAddresses.auxiliary.anchorAddress,
      )
    ) {
      throw new Error('CoGateway: Invalid stateRootProvider!!!');
    }

    Logger.info('Successfully completed CoGateway contract verification!!!');
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
    if (this.originWeb3.utils.toChecksumAddress(coAnchor)
      !== this.originWeb3.utils.toChecksumAddress(this.contractAddresses.auxiliary.anchorAddress)) {
      throw new Error('OriginAnchor: Invalid coAnchor address!!!');
    }

    const organization = await anchorInstance.methods.organization().call();
    if (this.originWeb3.utils.toChecksumAddress(organization)
      !== this.originWeb3.utils.toChecksumAddress(
        this.contractAddresses.origin.anchorOrganizationAddress,
      )
    ) {
      throw new Error('OriginAnchor: Invalid organization address!!!');
    }

    const remoteChainId = await anchorInstance.methods.getRemoteChainId().call();
    if (remoteChainId !== this.auxiliaryChainId) {
      throw new Error('OriginAnchor: Invalid remoteChainId!!!');
    }

    Logger.info('Successfully completed origin Anchor contract verification!!!');
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
    if (this.auxiliaryWeb3.utils.toChecksumAddress(coAnchor)
      !== this.auxiliaryWeb3.utils.toChecksumAddress(this.contractAddresses.origin.anchorAddress)) {
      throw new Error('AuxiliaryAnchor: Invalid coAnchor address!!!');
    }

    const organization = await anchorInstance.methods.organization().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(organization)
      !== this.auxiliaryWeb3.utils.toChecksumAddress(
        this.contractAddresses.auxiliary.anchorOrganizationAddress,
      )
    ) {
      throw new Error('AuxiliaryAnchor: Invalid organization address!!!');
    }

    const remoteChainId = await anchorInstance.methods.getRemoteChainId().call();
    if (remoteChainId !== this.mosaicConfig.originChain.chain) {
      throw new Error('AuxiliaryAnchor: Invalid remoteChainId!!!');
    }

    Logger.info('Successfully completed auxiliary Anchor contract verification!!!');
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
    if (this.auxiliaryWeb3.utils.toChecksumAddress(valueToken)
      !== this.auxiliaryWeb3.utils.toChecksumAddress(
        this.mosaicConfig.originChain.contractAddresses.simpleTokenAddress,
      )
    ) {
      throw new Error('OSTPrime: Invalid OSTPrime address!!!');
    }

    const initialized = await ostPrimeInstance.methods.initialized().call();
    if (initialized !== true) {
      throw new Error('OSTPrime: Invalid initialized value!!!');
    }

    const organization = await ostPrimeInstance.methods.organization().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(organization)
      !== this.auxiliaryWeb3.utils.toChecksumAddress(
        this.contractAddresses.auxiliary.ostCoGatewayOrganizationAddress,
      )
    ) {
      throw new Error('OSTPrime: Invalid organization address!!!');
    }

    const coGateway = await ostPrimeInstance.methods.coGateway().call();
    if (this.auxiliaryWeb3.utils.toChecksumAddress(coGateway)
      !== this.auxiliaryWeb3.utils.toChecksumAddress(
        this.contractAddresses.auxiliary.ostEIP20CogatewayAddress,
      )
    ) {
      throw new Error('OSTPrime: Invalid coGateway address!!!');
    }

    Logger.info('Successfully completed OSTPrime contract verification!!!');
  }
}
