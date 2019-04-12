/**
 * Holds the chain ids and addresses of a mosaic chain.
 */
export default class MosaicConfig {
  public originChainId: string;
  public originAnchorOrganizationAddress: string;
  public originAnchorAddress: string;
  public originOstGatewayOrganizationAddress: string;
  public originOstGatewayAddress: string;

  // The original sealer and deployer on auxiliary when the chain was generated.
  public auxiliaryOriginalSealer: string;
  public auxiliaryOriginalDeployer: string;

  public auxiliaryChainId: string;
  public auxiliaryAnchorOrganizationAddress: string;
  public auxiliaryAnchorAddress: string;
  public auxiliaryCoGatewayAndOstPrimeOrganizationAddress: string;
  public auxiliaryOstPrimeAddress: string;
  public auxiliaryOstCoGatewayAddress: string;
}
