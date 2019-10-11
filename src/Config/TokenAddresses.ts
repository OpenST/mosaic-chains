import MosaicConfig from './MosaicConfig';

/**
 * This class represents set of addresses specific to a single token gateway.
 */
export default class TokenAddresses {
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
   * Create token address instance based on mosaic config.
   * @param mosaicConfig Mosaic config object.
   * @param auxiliaryChain aux chain identifier.
   */
  public static fromMosaicConfig(
    mosaicConfig: MosaicConfig,
    auxiliaryChain: string,
  ): TokenAddresses {
    const auxiliaryContractAddresses = mosaicConfig.auxiliaryChains[auxiliaryChain]
      .contractAddresses.auxiliary;
    const originContractAddresses = mosaicConfig.auxiliaryChains[auxiliaryChain]
      .contractAddresses.origin;
    return new TokenAddresses(
      mosaicConfig.originChain.contractAddresses.stakePoolAddress,
      originContractAddresses.eip20GatewayAddress,
      originContractAddresses.anchorAddress,
      auxiliaryContractAddresses.anchorAddress,
      auxiliaryContractAddresses.eip20CoGatewayAddress,
      auxiliaryContractAddresses.redeemPoolAddress,
    );
  }
}
