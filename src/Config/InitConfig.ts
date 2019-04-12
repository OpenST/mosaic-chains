import * as fs from 'fs';
import * as path from 'path';
import Logger from '../Logger';
import Directory from '../Directory';

/**
 * An InitConfig is used when initializing a new auxiliary chain.
 */
export default class InitConfig {
  /** Required to know the sender account when sending transactions to the origin node. */
  public originTxOptions: { from: string };
  /** Bounty to set on the gateway on origin. */
  public originBounty: string = '';
  /** Bounty to set on the co-gateway on auxiliary. */
  public auxiliaryBounty: string = '';

  /** For the initial stake, the gas price to set. */
  public originStakeGasPrice: string = '';
  /** For the initial stake, the gas limit to set. */
  public originStakeGasLimit: string = '';
  /** The amount of OST to stake to initialize the auxiliary chain with, in Wei. */
  public originStakeAmount: string = '';
  /**
   * For the initial stake, wait this number of blocks after staking before reading the state root
   * from origin.
   */
  public originStakeBlocksToWait: number = 0;

  /** The address of the OST EIP20 token on origin. */
  public originOstAddress: string = '';
  /** Where to send burned tokens on origin. */
  public originBurnerAddress: string = '';
  /** Where to send burned tokens on auxiliary. */
  public auxiliaryBurnerAddress: string = '';

  /** How many state roots to store in the anchor ring buffer on origin. */
  public originAnchorBufferSize: string = '';
  /** How many state roots to store in the anchor ring buffer on auxiliary. */
  public auxiliaryAnchorBufferSize: string = '';

  // The owners and admins of the organizations.
  // !! Note that the origin and auxiliary gateway and co-gateway organization admins cannot be
  // !! set when creating the chain. They will be set to the addresses of the accounts that deploy
  // !! the contracts, as it is required to activate the gateway and set the co-gateway on OST prime.
  public originAnchorOrganizationOwner: string = '';
  public originAnchorOrganizationAdmin: string = '';
  public auxiliaryAnchorOrganizationOwner: string = '';
  public auxiliaryAnchorOrganizationAdmin: string = '';
  public originGatewayOrganizationOwner: string = '';
  public auxiliaryCoGatewayAndOstPrimeOrganizationOwner: string = '';

  /**
   * @param initialValues All properties of the initial values will be assigned to this class.
   * @throws If the configuration based on the initial values is invalid.
   */
  constructor(initialValues: any) {
    Object.assign(this, initialValues);

    if (!this.isValid()) {
      throw new Error('no valid configuration found');
    }
  }

  /**
   * Create a new InitConfig from the json in the `initialize` directory.
   * The name of the file must match the chain id.
   * @param auxiliaryChainId The chain id of the auxiliary chain
   * @returns The initialized InitConfig.
   */
  public static createFromFile(auxiliaryChainId: string): InitConfig {
    const fileValues = JSON.parse(
      fs.readFileSync(
        path.join(
          Directory.projectRoot,
          'initialize',
          `${auxiliaryChainId}.json`,
        ),
        { encoding: 'utf8' },
      )
    );

    fileValues.auxiliaryChainId = auxiliaryChainId;

    return new InitConfig(fileValues);
  }

  /**
   * Checks whether the provided InitConfig is complete.
   * @returns True if all values are set, false otherwise.
   */
  private isValid(): boolean {
    // Checking for every member that it is not the (initial) empty string if it is a string
    // and that it is not the (initial) zero value if it is a number.
    for (const member in this) {
      if (this.hasOwnProperty(member)) {
        const value = this[member];

        if (typeof value === 'string' && value === '') {
          Logger.error('invalid initial config', { missingKey: member });

          return false;
        }

        if (typeof value === 'number' && value === 0) {
          Logger.error(
            'invalid initial config; value cannot be zero or missing',
            { missingKey: member },
          );

          return false;
        }
      }
    }

    return true;
  }
}
