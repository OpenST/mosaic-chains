import MosaicConfig from './MosaicConfig';
import GatewayConfig from './GatewayConfig';

/**
 * This class represents set of addresses specific to a gateway pair.
 */
export default class GatewayAddresses {
  public readonly stakePoolAddress: string;

  public readonly eip20GatewayAddress: string;

  public readonly anchorAddress: string;

  public readonly coAnchorAddress: string;

  public readonly eip20CoGatewayAddress: string;

  public readonly redeemPoolAddress: string;

  /**
   * Constructor
   * @param stakePoolAddress StakePool Address address.
   * @param eip20GatewayAddress eip20Gateway address.
   * @param anchorAddress anchor address.
   * @param coAnchorAddress coanchor address.
   * @param eip20CoGatewayAddress cogateway address.
   * @param redeemPoolAddress redeem pool address.
   */
  private constructor(
    stakePoolAddress: string,
    eip20GatewayAddress: string,
    anchorAddress: string,
    coAnchorAddress: string,
    eip20CoGatewayAddress: string,
    redeemPoolAddress: string,
  ) {
    this.stakePoolAddress = stakePoolAddress;
    this.eip20GatewayAddress = eip20GatewayAddress;
    this.anchorAddress = anchorAddress;
    this.coAnchorAddress = coAnchorAddress;
    this.eip20CoGatewayAddress = eip20CoGatewayAddress;
    this.redeemPoolAddress = redeemPoolAddress;
  }


  /**
   * Create Gateway address instance based on mosaic config.
   * @param mosaicConfig Mosaic config object.
   * @param auxiliaryChain aux chain identifier.
   */
  public static fromMosaicConfig(
    mosaicConfig: MosaicConfig,
    auxiliaryChain: string,
  ): GatewayAddresses {
    const auxiliaryContractAddresses = mosaicConfig.auxiliaryChains[auxiliaryChain]
      .contractAddresses.auxiliary;
    const originContractAddresses = mosaicConfig.auxiliaryChains[auxiliaryChain]
      .contractAddresses.origin;
    return new GatewayAddresses(
      mosaicConfig.originChain.contractAddresses.stakePoolAddress,
      originContractAddresses.eip20GatewayAddress,
      originContractAddresses.anchorAddress,
      auxiliaryContractAddresses.anchorAddress,
      auxiliaryContractAddresses.eip20CoGatewayAddress,
      auxiliaryContractAddresses.redeemPoolAddress,
    );
  }

  /**
   * Creates gateway address instance from gateway config.
   * @param gatewayConfig GatewayConfig instance.
   */
  public static fromGatewayConfig(
    gatewayConfig: GatewayConfig,
  ): GatewayAddresses {
    const { auxChainId } = gatewayConfig;
    const stakePoolAddress = gatewayConfig.originContracts.stakePoolAddress
      ? gatewayConfig.originContracts.stakePoolAddress
      : gatewayConfig.mosaicConfig.originChain.contractAddresses.stakePoolAddress;

    const auxiliaryChain = gatewayConfig.mosaicConfig.auxiliaryChains[auxChainId];
    const auxiliaryContracts = auxiliaryChain.contractAddresses.auxiliary;
    const redeemPool = gatewayConfig.auxiliaryContracts.redeemPoolAddress
      ? gatewayConfig.auxiliaryContracts.redeemPoolAddress
      : auxiliaryContracts.redeemPoolAddress;

    const originContracts = auxiliaryChain.contractAddresses.origin;
    return new GatewayAddresses(
      stakePoolAddress,
      gatewayConfig.originContracts.eip20GatewayAddress,
      originContracts.anchorAddress,
      auxiliaryContracts.anchorAddress,
      gatewayConfig.auxiliaryContracts.eip20CoGatewayAddress,
      redeemPool,
    );
  }
}
