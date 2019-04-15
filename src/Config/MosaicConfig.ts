import * as fs from 'fs-extra';
import * as path from 'path';

import Directory from '../Directory';
import Logger from '../Logger';

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

  /**
   * Saves this config to a file in its auxiliary chain directory.
   */
  public writeToUtilityChainDirectory(): void {
    const configPath = path.join(
      Directory.getProjectUtilityChainDir(this.auxiliaryChainId),
      'config.json',
    );
    Logger.info('storing mosaic config', { configPath });

    fs.writeFileSync(
      configPath,
      JSON.stringify(this, null, '    '),
    );
  }
}
