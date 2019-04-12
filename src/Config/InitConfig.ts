import * as fs from 'fs';
import * as path from 'path';
import Logger from '../Logger';
import Directory from '../Directory';

/**
 * An InitConfig is used when initializing a new auxiliary chain.
 */
export default class InitConfig {
  /** Required to know the sender account when sending transactions to the origin node. */
  readonly originTxOptions: { from: string };
  /** Bounty to set on the gateway on origin. */
  readonly originBounty: string = '';
  /** Bounty to set on the co-gateway on auxiliary. */
  readonly auxiliaryBounty: string = '';

  /** For the initial stake, the gas price to set. */
  readonly originStakeGasPrice: string = '';
  /** For the initial stake, the gas limit to set. */
  readonly originStakeGasLimit: string = '';
  /** The amount of OST to stake to initialize the auxiliary chain with, in Wei. */
  readonly originStakeAmount: string = '';
  /**
   * For the initial stake, wait this number of blocks after staking before reading the state root
   * from origin.
   */
  readonly originStakeBlocksToWait: number = 0;

  /** The address of the OST EIP20 token on origin. */
  readonly originOstAddress: string = '';
  /** Where to send burned tokens on origin. */
  readonly originBurnerAddress: string = '';
  /** Where to send burned tokens on auxiliary. */
  readonly auxiliaryBurnerAddress: string = '';

  /** How many state roots to store in the anchor ring buffer on origin. */
  readonly originAnchorBufferSize: string = '';
  /** How many state roots to store in the anchor ring buffer on auxiliary. */
  readonly auxiliaryAnchorBufferSize: string = '';

  // The owners and admins of the organizations.
  // !! Note that the origin and auxiliary gateway and co-gateway organization admins cannot be
  // !! set when creating the chain. They will be set to the addresses of the accounts that deploy
  // !! the contracts, as it is required to activate the gateway and set the co-gateway on OST prime.
  readonly originAnchorOrganizationOwner: string = '';
  readonly originAnchorOrganizationAdmin: string = '';
  readonly auxiliaryAnchorOrganizationOwner: string = '';
  readonly auxiliaryAnchorOrganizationAdmin: string = '';
  readonly originGatewayOrganizationOwner: string = '';
  readonly auxiliaryCoGatewayAndOstPrimeOrganizationOwner: string = '';

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
