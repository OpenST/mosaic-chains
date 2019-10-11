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
    this.mosaicConfig = MosaicConfig.fromChain(this.originChainIdentifier);
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
    let messageBusLinkInfo = {
      address: this.mosaicConfig.originChain.contractAddresses.messageBusAddress,
      name: 'MessageBus',
    };
    let gatewayLibLinkInfo = {
      address: this.mosaicConfig.originChain.contractAddresses.gatewayLibAddress,
      name: 'GatewayLib',
    };
    await this.validateLinkedBin(
      this.originWeb3,
      'EIP20Gateway',
      this.contractAddresses.origin.eip20GatewayAddress,
      messageBusLinkInfo,
      gatewayLibLinkInfo,
      'ContractsBin: Mismatch of gateway BIN!!!',
    );

    messageBusLinkInfo = {
      address: this.contractAddresses.auxiliary.messageBusAddress,
      name: 'MessageBus',
    };
    gatewayLibLinkInfo = {
      address: this.contractAddresses.auxiliary.gatewayLibAddress,
      name: 'GatewayLib',
    };
    await this.validateLinkedBin(
      this.auxiliaryWeb3,
      'EIP20CoGateway',
      this.contractAddresses.auxiliary.eip20CoGatewayAddress,
      messageBusLinkInfo,
      gatewayLibLinkInfo,
      'ContractsBin: Mismatch of CoGateway BIN!!!',
    );

    await this.validateBIN(
      this.originWeb3,
      'Anchor',
      this.contractAddresses.origin.anchorAddress,
      'ContractsBin: Mismatch of origin anchor BIN!!!',
    );

    await this.validateBIN(
      this.auxiliaryWeb3,
      'Anchor',
      this.contractAddresses.auxiliary.anchorAddress,
      'ContractsBin: Mismatch of auxiliary anchor BIN!!!',
    );

    await this.validateBIN(
      this.originWeb3,
      'Organization',
      this.contractAddresses.origin.anchorOrganizationAddress,
      'ContractsBin: Mismatch of origin anchor organization BIN!!!',
    );

    await this.validateBIN(
      this.auxiliaryWeb3,
      'Organization',
      this.contractAddresses.auxiliary.anchorOrganizationAddress,
      'ContractsBin: Mismatch of auxiliary anchor organization BIN!!!',
    );

    await this.validateBIN(
      this.originWeb3,
      'Organization',
      this.contractAddresses.origin.gatewayOrganizationAddress,
      'ContractsBin: Mismatch of origin gateway organization BIN!!!',
    );

    await this.validateBIN(
      this.auxiliaryWeb3,
      'Organization',
      this.contractAddresses.auxiliary.coGatewayOrganizationAddress,
      'ContractsBin: Mismatch of auxiliary coGateway organization BIN!!!',
    );

    await this.validateBIN(
      this.auxiliaryWeb3,
      'OSTPrime',
      this.contractAddresses.auxiliary.utilityTokenAddress,
      'ContractsBin: Mismatch of utilityTokenAddress BIN!!!',
    );

    Logger.info('Successfully completed contracts BIN verification!!!');
  }

  /**
   * This method does verification of Gateway storage data.
   *
   * @returns {Promise<void>}
   */
  private async verifyGateway(): Promise<void> {
    const gatewayInstance = this.mosaicContract.EIP20Gateway(
      this.contractAddresses.origin.eip20GatewayAddress,
    );

    const isActivated = await gatewayInstance.methods.activated().call();
    if (isActivated !== true) {
      const errMsg = 'Gateway: It\'s not activated!!!';
      Logger.error(errMsg);
      throw new Error(errMsg);
    }

    const valueToken = await gatewayInstance.methods.token().call();
    ChainVerifier.validateDeployedAddress(
      this.originWeb3,
      valueToken,
      this.mosaicConfig.originChain.contractAddresses.valueTokenAddress,
      'Gateway: Invalid valueToken address!!!',
    );

    const baseToken = await gatewayInstance.methods.baseToken().call();
    ChainVerifier.validateDeployedAddress(
      this.originWeb3,
      baseToken,
      this.mosaicConfig.auxiliaryChains[this.auxiliaryChainId].contractAddresses.origin.baseTokenAddress,
      'Gateway: Invalid baseToken address!!!',
    );

    const organization = await gatewayInstance.methods.organization().call();
    ChainVerifier.validateDeployedAddress(
      this.originWeb3,
      organization,
      this.contractAddresses.origin.gatewayOrganizationAddress,
      'Gateway: Invalid gateway organization address!!!',
    );

    const remoteGateway = await gatewayInstance.methods.remoteGateway().call();
    ChainVerifier.validateDeployedAddress(
      this.originWeb3,
      remoteGateway,
      this.contractAddresses.auxiliary.eip20CoGatewayAddress,
      'Gateway: Invalid CoGateway address!!!',
    );

    const stateRootProvider = await gatewayInstance.methods.stateRootProvider().call();
    ChainVerifier.validateDeployedAddress(
      this.originWeb3,
      stateRootProvider,
      this.contractAddresses.origin.anchorAddress,
      'Gateway: Invalid stateRootProvider!!!',
    );

    Logger.info('Successfully completed gateway contract verification!!!');
  }

  /**
   * This method does verification of CoGateway state data.
   *
   * @returns {Promise<void>}
   */
  private async verifyCoGateway(): Promise<void> {
    const coGatewayInstance = this.mosaicContract.EIP20CoGateway(
      this.contractAddresses.auxiliary.eip20CoGatewayAddress,
    );

    const valueToken = await coGatewayInstance.methods.valueToken().call();
    ChainVerifier.validateDeployedAddress(
      this.auxiliaryWeb3,
      valueToken,
      this.mosaicConfig.originChain.contractAddresses.valueTokenAddress,
      'CoGateway: Invalid valueToken address!!!',
    );

    const utilityToken = await coGatewayInstance.methods.utilityToken().call();

    ChainVerifier.validateDeployedAddress(
      this.auxiliaryWeb3,
      utilityToken,
      this.contractAddresses.auxiliary.utilityTokenAddress,
      'CoGateway: Invalid utilityToken address!!!',
    );

    const organization = await coGatewayInstance.methods.organization().call();
    ChainVerifier.validateDeployedAddress(
      this.auxiliaryWeb3,
      organization,
      this.contractAddresses.auxiliary.coGatewayOrganizationAddress,
      'CoGateway: Invalid organization address!!!',
    );

    const remoteGateway = await coGatewayInstance.methods.remoteGateway().call();
    ChainVerifier.validateDeployedAddress(
      this.auxiliaryWeb3,
      remoteGateway,
      this.contractAddresses.origin.eip20GatewayAddress,
      'CoGateway: Invalid remoteGateway address!!!',
    );

    const stateRootProvider = await coGatewayInstance.methods.stateRootProvider().call();
    ChainVerifier.validateDeployedAddress(
      this.auxiliaryWeb3,
      stateRootProvider,
      this.contractAddresses.auxiliary.anchorAddress,
      'CoGateway: Invalid stateRootProvider!!!',
    );
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
    ChainVerifier.validateDeployedAddress(
      this.auxiliaryWeb3,
      coAnchor,
      this.contractAddresses.auxiliary.anchorAddress,
      'OriginAnchor: Invalid coAnchor address!!!',
    );

    const organization = await anchorInstance.methods.organization().call();
    ChainVerifier.validateDeployedAddress(
      this.originWeb3,
      organization,
      this.contractAddresses.origin.anchorOrganizationAddress,
      'OriginAnchor: Invalid organization address!!!',
    );

    const remoteChainId = await anchorInstance.methods.getRemoteChainId().call();
    if (remoteChainId !== this.auxiliaryChainId) {
      const errMsg = 'OriginAnchor: Invalid remoteChainId!!!';
      Logger.error(errMsg);
      throw new Error(errMsg);
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
    ChainVerifier.validateDeployedAddress(
      this.originWeb3,
      coAnchor,
      this.contractAddresses.origin.anchorAddress,
      'AuxiliaryAnchor: Invalid coAnchor address!!!',
    );

    const organization = await anchorInstance.methods.organization().call();
    ChainVerifier.validateDeployedAddress(
      this.auxiliaryWeb3,
      organization,
      this.contractAddresses.auxiliary.anchorOrganizationAddress,
      'AuxiliaryAnchor: Invalid organization address!!!',
    );

    const remoteChainId = await anchorInstance.methods.getRemoteChainId().call();
    if (remoteChainId !== this.mosaicConfig.originChain.chain) {
      const errMsg = 'AuxiliaryAnchor: Invalid remoteChainId!!!';
      Logger.error(errMsg);
      throw new Error(errMsg);
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
      this.contractAddresses.auxiliary.utilityTokenAddress,
    );

    const valueToken = await ostPrimeInstance.methods.token().call();
    ChainVerifier.validateDeployedAddress(
      this.auxiliaryWeb3,
      valueToken,
      this.mosaicConfig.originChain.contractAddresses.valueTokenAddress,
      'OSTPrime: Invalid OSTPrime address!!!',
    );

    const initialized = await ostPrimeInstance.methods.initialized().call();
    if (initialized !== true) {
      const errMsg = 'OSTPrime: Invalid initialized value!!!';
      Logger.error(errMsg);
      throw new Error(errMsg);
    }

    const organization = await ostPrimeInstance.methods.organization().call();
    ChainVerifier.validateDeployedAddress(
      this.auxiliaryWeb3,
      organization,
      this.contractAddresses.auxiliary.coGatewayOrganizationAddress,
      'OSTPrime: Invalid organization address!!!',
    );

    const coGateway = await ostPrimeInstance.methods.coGateway().call();
    ChainVerifier.validateDeployedAddress(
      this.auxiliaryWeb3,
      coGateway,
      this.contractAddresses.auxiliary.eip20CoGatewayAddress,
      'OSTPrime: Invalid coGateway address!!!',
    );

    Logger.info('Successfully completed OSTPrime contract verification!!!');
  }

  /**
   * Check if deployed bin is valid or not
   * @param web3 Web3 endpoint.
   * @param contractName Name of the contract to verify.
   * @param contractAddress Contract address to verify.
   * @param errMsg Error message to log and throw.
   */
  private async validateBIN(web3, contractName, contractAddress, errMsg) {
    const deployedBin = await web3.eth.getCode(contractAddress);
    if (this.abiBinProvider.getBIN(contractName).toLowerCase().indexOf(
      deployedBin.toLowerCase().slice(2),
    ) === -1
    ) {
      Logger.error(errMsg, { contractName, contractAddress });
      throw new Error(errMsg);
    }
  }

  /**
   * Check if deployed bin is valid or not
   * @param web3 Web3 endpoint.
   * @param contractName Name of the contract to verify.
   * @param contractAddress Contract address to verify.
   * @param messageBusLinkInfo Linked bin info of message bus contract.
   * @param gatewayLibLinkInfo Linked bin info of gateway lib contract.
   * @param errMsg Error message to log and throw.
   */
  private async validateLinkedBin(
    web3,
    contractName,
    contractAddress,
    messageBusLinkInfo,
    gatewayLibLinkInfo,
    errMsg,
  ) {
    const gatewayLinkedBin = this.abiBinProvider.getLinkedBIN(
      contractName,
      messageBusLinkInfo,
      gatewayLibLinkInfo,
    );
    const deployedBin = await web3.eth.getCode(contractAddress);
    if (gatewayLinkedBin.toLowerCase().indexOf(deployedBin.slice(2).toLowerCase()) === -1) {
      Logger.error(errMsg);
      throw new Error(errMsg);
    }
  }

  /**
   * Check if deployed bin is valid or not
   * @param web3 Web3 endpoint.
   * @param deployedAddress Address of the contract to verify.
   * @param mosaicConfigAddress Expected address of the contract.
   * @param errMsg Error message to show.
   */
  private static validateDeployedAddress(
    web3,
    deployedAddress,
    mosaicConfigAddress,
    errMsg,
  ) {
    if (web3.utils.toChecksumAddress(deployedAddress)
      !== web3.utils.toChecksumAddress(mosaicConfigAddress)) {
      Logger.error(errMsg, { expected: mosaicConfigAddress, deployed: deployedAddress });
      throw new Error(errMsg);
    }
  }
}
