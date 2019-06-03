import Web3 = require('web3');

import MosaicConfig from "../Config/MosaicConfig";
import { ContractInteract, Contracts as MosaicContracts } from '@openst/mosaic.js';

/**
 * Chain verifier class which does verification of newly
 * created auxiliary chains.
 */
export default class ChainVerifier {

  private originWeb3: Web3;

  private auxiliaryWeb3: Web3;

  private mosaicContractInstance: MosaicContracts;

  constructor(
    private originWebSocket: string,
    private auxiliaryWebSocket: string,
    private chainId: string,
  ) {
    this.originWeb3 = new Web3(originWebSocket);
    this.auxiliaryWeb3 = new Web3(auxiliaryWebSocket);
    this.mosaicConfig =  MosaicConfig.from(chainId);
    this.mosaicContractInstance = new MosaicContracts(this.originWeb3, this.auxiliaryWeb3);
  }

  public async verify(): Promise<void> {
    // this.verifyContractsBin();
    this.validateOriginGateway();
    this.validateAuxiliaryGateway();
    // this.verifyAnchors();
    // this.verifyOSTPrime();
  }

  private async verifyContractsBin(): Promise<void> {

  }

  private async validateOriginGateway(): Promise<void> {
    const gatewayInstance = this.mosaicContractInstance.EIP20Gateway(gatewayAddress);
    // Verify Gateway should be activated.
    const isActivated = gatewayInstance.methods.activated.call();
    if ( isActivated == false) {
      throw new Error('Gateway should be activated');
    }
    const valueToken = gatewayInstance.methods.valueToken.call();
    const baseToken = gatewayInstance.methods.baseToken.call();
    // Verify organization address
    const gatewayOrganization = gatewayInstance.methods.organization.call();
    const remoteGateway = gatewayInstance.methods.remoteGateway.call();
    const stateRootProvider = gatewayInstance.methods.stateRootProvider.call();
  }

  private async  validateAuxiliaryGateway(): Promise<void> {
    const coGatewayInstance = contractInstance.EIP20CoGateway(gatewayAddress);
    const valueToken = coGatewayInstance.methods.valueToken.call();
    const utilityToken = coGatewayInstance.methods.utilityToken.call();
    // Verify organization address
    const organization = coGatewayInstance.methods.organization.call();
    const remoteGateway = coGatewayInstance.methods.remoteGateway.call();
    const stateRootProvider = coGatewayInstance.methods.stateRootProvider.call();
  }

  private async verifyAnchors(): Promise<void> {

  }

  private async verifyOSTPrime(): Promise<void> {

  }

}
