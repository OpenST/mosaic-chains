import { ContractInteract } from '@openst/mosaic.js';
import Web3 = require('web3');
import InitConfig from '../Config/InitConfig';
import Logger from '../Logger';
import MosaicConfig from '../Config/MosaicConfig';
import Contracts from './Contracts';

/**
 * The origin chain when creating a new auxiliary chain.
 */
export default class OriginChain {
  private chainId: string;
  private ostGateway: ContractInteract.EIP20Gateway;

  constructor(
    private initConfig: InitConfig,
    private web3: Web3,
    private auxiliaryChainId: string,
  ) { }

  /**
   * @returns The Web3 instance of this chain.
   */
  public getWeb3(): Web3 {
    return this.web3;
  }

  /**
   * @returns The chain id of this chain as gotten from the node.
   */
  public async getChainId(): Promise<string> {
    if (!this.chainId) {
      this.chainId = await this.web3.eth.net.getId().then(number => number.toString(10));
      this.logInfo('fetched chain id');
    }

    return this.chainId;
  }

  /**
   * Deploys all contracts that are required on origin to create a new auxiliary chain.
   */
  public async deployContracts(
    mosaicConfig: MosaicConfig,
    auxiliaryStateRootZero: string,
    expectedOstCoGatewayAddress: string,
  ): Promise<MosaicConfig> {
    this.logInfo('deploying contracts on origin');

    const anchorOrganization = await this.deployOrganization(
      this.initConfig.originAnchorOrganizationOwner,
      this.initConfig.originAnchorOrganizationAdmin,
    );
    mosaicConfig.originAnchorOrganizationAddress = anchorOrganization.address;

    // Initial state root must be set for block height zero of the auxiliary chain.
    const anchor = await this.deployAnchor(
      this.auxiliaryChainId,
      anchorOrganization.address,
      '0',
      auxiliaryStateRootZero,
    );
    mosaicConfig.originAnchorAddress = anchor.address;

    // Owner of the organization has to be the deployer, as we need to be able to activate the
    // gateway
    const ostGatewayOrganization = await this.deployOrganization(
      this.initConfig.originGatewayOrganizationOwner,
      this.initConfig.originTxOptions.from,
    );
    mosaicConfig.originOstGatewayOrganizationAddress = ostGatewayOrganization.address;

    const ostGateway = await this.deployGateway(
      anchor.address,
      ostGatewayOrganization.address,
    );
    mosaicConfig.originOstGatewayAddress = ostGateway.address;

    this.logInfo(
      'activating ost gateway with precalculated ost co-gateway address',
      { expectedAddress: expectedOstCoGatewayAddress },
    );
    await ostGateway.activateGateway(expectedOstCoGatewayAddress, this.initConfig.originTxOptions);

    this.ostGateway = ostGateway;

    return mosaicConfig;
  }

  /**
   * Stakes on the origin gateway and returns the details of the stake.
   */
  public async stake(
    mosaicConfig: MosaicConfig,
    hashLockSecret: string,
  ): Promise<{ blockNumber: number, stateRoot: string, messageHash: string }> {
    // First stake on the new gateway.
    const nonce = '1';
    const hashLockHash = Web3.utils.sha3(hashLockSecret);

    // For the OST gateway, the base token and the stake token are the same: OST.
    const stakePlusBounty: string = (
      parseInt(this.initConfig.originStakeAmount) + parseInt(this.initConfig.originBounty)
    ).toString();
    this.logInfo(
      'approving stake plus bounty on ost',
      { spender: this.ostGateway.address, amount: stakePlusBounty },
    );
    const ost = new ContractInteract.EIP20Token(this.web3, this.initConfig.originOstAddress);
    await ost.approve(
      this.ostGateway.address,
      stakePlusBounty,
      this.initConfig.originTxOptions,
    );

    this.logInfo('staking');
    const messageHash: string = await this.ostGateway.stake(
      this.initConfig.originStakeAmount,
      mosaicConfig.auxiliaryOriginalDeployer,
      this.initConfig.originStakeGasPrice,
      this.initConfig.originStakeGasLimit,
      nonce,
      hashLockHash,
      this.initConfig.originTxOptions,
    ).then((stakeReceipt) => {
      const stakeIntentDeclaredEvent = stakeReceipt.events.StakeIntentDeclared;

      return stakeIntentDeclaredEvent.returnValues._messageHash;
    });
    this.logInfo('staked', { messageHash });

    const blockNumber: number = await this.waitBlocks(this.initConfig.originStakeBlocksToWait);
    const stateRoot: string = await this.getStateRoot(blockNumber);

    return {
      blockNumber,
      stateRoot,
      messageHash,
    }
  }

  /**
   * Progresses the given stake with the given secret.
   */
  public async progressWithSecret(
    mosaicConfig: MosaicConfig,
    messageHash: string,
    hashLockSecret: string,
  ): Promise<void> {
    this.logInfo('progressing stake with secret');
    const ostGateway = new ContractInteract.EIP20Gateway(
      this.web3,
      mosaicConfig.auxiliaryOstCoGatewayAddress,
    );
    return ostGateway.progressStake(messageHash, hashLockSecret, this.initConfig.originTxOptions);
  }

  private deployOrganization(owner: string, admin: string): Promise<ContractInteract.Organization> {
    this.logInfo('deploying organization', { owner, admin });
    return Contracts.deployOrganization(this.web3, this.initConfig.originTxOptions, owner, admin);
  }

  /**
   * Deploys an anchor contract.
   */
  private deployAnchor(
    remoteChainId: string,
    organizationAddress: string,
    blockHeight: string,
    stateRoot: string,
  ): Promise<ContractInteract.Anchor> {
    this.logInfo(
      'deploying anchor',
      { remoteChainId, organizationAddress, blockHeight, stateRoot },
    );
    return Contracts.deployAnchor(
      this.web3,
      this.initConfig.originTxOptions,
      remoteChainId,
      blockHeight,
      stateRoot,
      this.initConfig.originAnchorBufferSize,
      organizationAddress,
    );
  }

  /**
   * Deploys a gateway.
   */
  private deployGateway(
    anchorAddress: string,
    organizationAddress: string,
  ): Promise<ContractInteract.EIP20Gateway> {
    this.logInfo('deploying ost gateway', { anchorAddress, organizationAddress })
    return Contracts.deployOstGateway(
      this.web3,
      this.initConfig.originTxOptions,
      this.initConfig.originOstAddress,
      anchorAddress,
      this.initConfig.originBounty,
      organizationAddress,
      this.initConfig.originBurnerAddress,
    );
  }

  /**
   * @returns A promise that resolves once the given number of new block headers have been received.
   */
  private waitBlocks(numberOfBlocksToWait: number): Promise<number> {
    this.logInfo('waiting for blocks', { numberOfBlocksToWait });
    return new Promise((resolve, reject) => {
      // Forcing type to `any` as the web3 types are wrongly returning a Promise.
      const blockHeaderSubscription: any = this.web3.eth.subscribe('newBlockHeaders');
      blockHeaderSubscription.on(
        'data',
        (blockHeader) => {
          const blockNumber = blockHeader.number;
          numberOfBlocksToWait = numberOfBlocksToWait - 1;
          this.logInfo('received block header', { blockNumber, numberOfBlocksToWait });

          if (numberOfBlocksToWait <= 0) {
            blockHeaderSubscription.unsubscribe();
            resolve(blockNumber);
          }
        },
      );

      blockHeaderSubscription.on(
        'error',
        error => reject(error),
      );
    });
  }

  /**
   * @returs The state root at the given block height.
   */
  private getStateRoot(blockHeight: number): Promise<string> {
    return this.web3.eth.getBlock(blockHeight).then(
      (block) => {
        const stateRoot = block.stateRoot;
        this.logInfo('fetched state root', { blockHeight, stateRoot });

        return stateRoot;
      }
    );
  }

  /**
   * Logs the given message and meta data on log level info.
   */
  private logInfo(message: string, metaData: any = {}): void {
    Logger.info(message, { chain: 'origin', chainId: this.chainId, ...metaData });
  }
}
