import * as fs from 'fs-extra';
import * as path from 'path';
import * as RLP from 'rlp';
import {
  ContractInteract,
  Contracts as MosaicContracts,
  Utils as MosaicUtils,
} from '@openst/mosaic.js';

import { Tx } from 'web3/eth/types';
import CliqueGenesis from './CliqueGenesis';
import Contracts from './Contracts';
import Shell from '../Shell';
import Directory from '../Directory';
import Logger from '../Logger';
import NodeDescription from '../Node/NodeDescription';
import GethNode, { GETH_VERSION } from '../Node/GethNode';
import InitConfig from '../Config/InitConfig';
import Proof from './Proof';

import Web3 = require('web3');

/**
 * The new auxiliary chain that shall be created.
 */
export default class AuxiliaryChainInteract {
  private web3: Web3;

  private chainDir: string;

  private sealer: string;

  private deployer: string;

  private maxTriesToUnlockAccounts = 5;

  // The below nonces are more for documentation.
  // However, they are set on the deployment transaction options to enforce failure if the order
  // changes or a contract is added or removed.
  // Co-gateway nonce is used when calculating its expected address.
  private anchorOrganizationDeploymentNonce = 0;

  private anchorDeploymentNonce = 1;

  private coGatewayAndOstPrimeOrganizationDeploymentNonce = 2;

  private ostPrimeDeploymentNonce = 3;

  private coGatewayDeploymentNonce = 7;

  private _auxiliarySealer: string;

  private _auxiliaryDeployer: string;

  private bootKeyFilePath: string;

  /*
  Anchor
   * * Organization for co-gateway and OST prime
   * * OST prime
   * * OST co-gateway with all its libraries:
   *     * Merkle Patricia proof
   *     * Message bus
   *     * Gateway lib
   */
  constructor(
    private initConfig: InitConfig,
    private chainId: string,
    private originChain: string,
    private nodeDescription: NodeDescription,
  ) {
    this.chainDir = path.join(nodeDescription.mosaicDir, originChain, this.chainId);
  }

  /**
   * @returns The Web3 instance of this chain.
   */
  public getWeb3(): Web3 {
    return this.web3;
  }

  /**
   * @returns The chain id of this chain as gotten from the node.
   */
  public getChainId(): string {
    return this.chainId;
  }

  /**
   * Generates a new chain, starts a sealer that runs the chain, and returns the addresses of the
   * sealer and a deployer that can deploy contracts. The deployer gets the initial value allocated
   * to it in the genesis file.
   */
  public async startNewChainSealer(): Promise<{ sealer: string; deployer: string }> {
    this.generateAccounts();
    this.generateChain();
    await this.startNewSealer();

    return {
      sealer: this.sealer,
      deployer: this.deployer,
    };
  }

  /**
   * @returns The state root at block height zero.
   */
  public async getStateRootZero(): Promise<string> {
    const blockHeight = 0;
    const block = await this.web3.eth.getBlock(blockHeight);
    const { stateRoot } = block;

    this.logInfo('fetched state root zero', { blockHeight, stateRoot });

    return stateRoot;
  }

  /**
   * Returns the address that the co-gateway will have once it will be deployed. The address is
   * pre-calculated and the co-gateway is not actually deployed.
   */
  public getExpectedOstCoGatewayAddress(auxiliaryDeployer: string): string {
    // Forcing type `any`, as web3 sha3 otherwise complains that it only accepts strings.
    // `RLP.encode()` returns a `Buffer`.
    // However, converting the buffer to a string first yields the wrong result. The buffer has to
    // be passed directly into the sha3 function.
    const encoded: any = RLP.encode(
      [
        auxiliaryDeployer,
        this.coGatewayDeploymentNonce,
      ],
    );
    const nonceHash: string = this.web3.utils.sha3(encoded);
    // Remove leading `0x` and first 24 characters (12 bytes) of the hex
    // string leaving us with the remaining 40 characters (20 bytes) that
    // make up the address. Also adding the removed leading `0x` again.
    const expectedOstCoGatewayAddress = this.web3.utils.toChecksumAddress(
      `0x${nonceHash.substring(26)}`,
    );

    return expectedOstCoGatewayAddress;
  }

  /**
   * Deploys all the auxiliary contracts and initializes them by moving all the base coin into OST
   * prime. Also proves the origin stake.
   * Deployed contracts:
   *
   * * Organization for anchor
   * * Anchor
   * * Organization for co-gateway and OST prime
   * * OST prime
   * * OST co-gateway with all its libraries:
   *     * Merkle Patricia proof
   *     * Message bus
   *     * Gateway lib
   *
   * @param originOstGatewayAddress The address of the origin gateway of this chain.
   * @param originHeight The origin block height at which the origin stake should be proven.
   * @param originStateRoot The origin state root at the given block height.
   * @param stakeMessageNonce The nonce of the stake message that was sent to the gateway on origin.
   * @param hashLockSecret The secret of the hash lock that was used to generate the hash for the
   *     lock for the origin stake.
   * @param proofData The proof data of the origin stake. Will be used to proof the stake against an
   *     available origin state root on auxiliary.
   * @param originChainId Chain ID of origin chain is used to set remote chain Id in anchor.
   * It's required because originChain in the constructor can be a string like ropsten.
   */
  public async initializeContracts(
    originOstGatewayAddress: string,
    originHeight: string,
    originStateRoot: string,
    stakeMessageNonce: string,
    hashLockSecret: string,
    proofData: Proof,
    originChainId?: string,
  ): Promise<{
    anchorOrganization: ContractInteract.Organization;
    anchor: ContractInteract.Anchor;
    coGatewayAndOstPrimeOrganization: ContractInteract.Organization;
    ostPrime: ContractInteract.OSTPrime;
    ostCoGateway: ContractInteract.EIP20CoGateway;
    gatewayLib: ContractInteract.GatewayLib;
    messageBus: ContractInteract.MessageBus;
    merklePatriciaProof: ContractInteract.MerklePatriciaProof;
  }> {
    const {
      anchorOrganization,
      anchor,
      coGatewayAndOstPrimeOrganization,
      ostPrime,
      ostCoGateway,
      gatewayLib,
      messageBus,
      merklePatriciaProof,
    } = await this.deployContracts(
      originOstGatewayAddress,
      originHeight,
      originStateRoot,
      originChainId,
    );

    await this.transferAllOstIntoOstPrime(ostPrime.address);
    await this.proveStake(
      ostCoGateway.address,
      stakeMessageNonce,
      hashLockSecret,
      proofData,
    );

    return {
      anchorOrganization,
      anchor,
      coGatewayAndOstPrimeOrganization,
      ostPrime,
      ostCoGateway,
      gatewayLib,
      messageBus,
      merklePatriciaProof,
    };
  }

  /**
   * Progresses an already proven stake intent with the secret of the hash lock.
   */
  public async progressWithSecret(
    auxiliaryOstCoGatewayAddress: string,
    messageHash: string,
    hashLockSecret: string,
  ): Promise<void> {
    this.logInfo('progressing mint with secret');
    const ostCoGateway = new ContractInteract.EIP20CoGateway(
      this.web3,
      auxiliaryOstCoGatewayAddress,
    );
    return ostCoGateway.progressMint(messageHash, hashLockSecret, this.txOptions);
  }

  /**
   * Resets organization contracts admin address to `address(0)`.
   *
   * @param organization Auxiliary chain organization address.
   * @param txOptions Transaction options.
   *
   * @returns {Promise} Promise containing transaction receipt.
   */
  public async resetOrganizationAdmin(
    organization,
    txOptions,
  ): Promise<Record<string, any>> {
    this.logInfo('reseting auxiliary chain organization admin.', { organization, txOptions });
    // ContractInteract.Organization doesn't implement setAdmin function in mosaic.js.
    // That's why MosaicContracts being used here.
    const contractInstance = new MosaicContracts(undefined, this.web3);
    const tx = contractInstance.AuxiliaryOrganization(organization)
      .methods.setAdmin('0x0000000000000000000000000000000000000000');
    return tx.send(txOptions);
  }

  /**
   * This returns genesis of the auxiliary chain.
   */
  public getGenesis(): any {
    return CliqueGenesis.create(this.chainId, this.sealer, this.deployer);
  }

  /**
   *  This returns boot node of the auxiliary chain.
   */
  public getBootNode(): string {
    const bootNodeKey = fs.readFileSync(this.bootKeyFilePath).toString();
    const command = `docker run -e NODE_KEY=${bootNodeKey} hawyasunaga/ethereum-bootnode /bin/sh -c 'bootnode --nodekeyhex=$NODE_KEY --writeaddress'`;
    const bootNode = Shell.executeInShell(command);
    return bootNode.toString().trim();
  }

  /**
   * Getter for auxiliary deployer.
   */
  get auxiliaryDeployer(): string {
    return this._auxiliaryDeployer;
  }

  /**
   * Setter for auxiliary deployer.
   * @param value Deployer address.
   */
  set auxiliaryDeployer(value: string) {
    this._auxiliaryDeployer = value;
  }

  /**
   * Setter for auxiliary sealer.
   * @param value Sealer address.
   */
  set auxiliarySealer(value: string) {
    this._auxiliarySealer = value;
  }

  /**
   * This method set organization admin.
   * @param admin Admin address.
   * @param organization Organization contract interact.
   */
  public async setOrganizationAdmin(
    admin: string,
    organization: ContractInteract.Organization,
  ) {
    return MosaicUtils.sendTransaction(
      organization.contract.methods.setAdmin(admin),
      this.txOptions,
    );
  }

  /**
   * This method set co-anchor address;
   * @param auxiliaryAnchor Instance of anchor contract on auxiliary chain.
   * @param coAnchorAddress CoAnchor address.
   */
  public async setCoAnchorAddress(
    auxiliaryAnchor: ContractInteract.Anchor,
    coAnchorAddress: string,
  ) {
    return auxiliaryAnchor.setCoAnchorAddress(
      coAnchorAddress,
      this.txOptions,
    );
  }

  /**
   * Generates two new accounts with an ethereum node and adds the addresses to the mosaic config
   * as auxiliaryOriginalSealer and auxiliaryOriginalDeployer. These accounts will be used to run
   * the sealer and deploy the contracts on auxiliary.
   * @throws If keystore already exists for the chain.
   */
  private generateAccounts(): void {
    if (fs.existsSync(path.join(this.chainDir, 'keystore'))) {
      const message = 'keystore already exists; cannot continue; delete keystore before running command again';
      this.logError(message);

      throw new Error(message);
    }

    this.logInfo('generating auxiliary address for sealer and deployer');

    const args = [
      'run',
      '--rm',
      '--volume', `${this.chainDir}:/chain_data`,
      '--volume', `${this.nodeDescription.password}:/password.txt`,
      `ethereum/client-go:${GETH_VERSION}`,
      'account',
      'new',
      '--password', '/password.txt',
      '--datadir', '/chain_data',
    ];

    // The command is executed twice in order to create two accounts. Each time the command is run,
    // it creates one new account. This is also the reason why the password file must contain the
    // same password twice, once per line. Both accounts get created with the password on the first
    // line of the file, but both lines are read for unlocking when the node is later started.
    Shell.executeDockerCommand(args);
    Shell.executeDockerCommand(args);


    // It doesn't matter which account we assign which role as both accounts are new.
    [this.sealer, this.deployer] = this.getAccounts();
  }

  /**
   * Initializes a new chain from a new genesis.
   */
  private generateChain(): void {
    this.logInfo('generating a new auxiliary chain');
    this.generateGenesisFile();
    this.initFromGenesis();
    this.copyStateToChainsDir();
  }

  /**
   * Start a sealer node that runs the new auxiliary chain.
   */
  private async startNewSealer(): Promise<void> {
    this.logInfo('starting a sealer node');
    const bootKeyFile = this.generateBootKey();

    const unlockAccounts = [this.sealer, this.deployer];
    this.nodeDescription.unlock = unlockAccounts.join(',');

    const node = new GethNode(this.nodeDescription);
    // We always start a new chain with gas price zero.
    const gasPrice = '0';
    // 10 mio. as per `CliqueGenesis.ts`.
    const targetGasLimit = '10000000';
    node.startSealer(gasPrice, targetGasLimit, bootKeyFile);
    // The sealer runs locally on this machine and the port is published to the host from the
    // docker container.
    // Has to be RPC and not WS. WS connection was closed before deploying the Co-Gateway.
    // Reason unknown. Possibly due to the fact that according to `lsof` node keeps opening new
    // connections.
    this.web3 = new Web3(`http://127.0.0.1:${this.nodeDescription.rpcPort}`);
    await this.verifyAccountsUnlocking();
  }

  /**
   * It polls every 4-secs to fetch the list of wallets.
   * It logs error when connection is not established even after max tries.
   */
  private async verifyAccountsUnlocking(): Promise<void> {
    let totalWaitTimeInSeconds = 0;
    const timeToWaitInSecs = 4;
    let unlockStatus: boolean;
    do {
      await AuxiliaryChainInteract.sleep(timeToWaitInSecs * 1000);
      totalWaitTimeInSeconds += timeToWaitInSecs;
      if (totalWaitTimeInSeconds > (this.maxTriesToUnlockAccounts * timeToWaitInSecs)) {
        throw new Error('node did not unlock accounts in time');
      }
      unlockStatus = await this.getAccountsStatus(totalWaitTimeInSeconds / timeToWaitInSecs);
    } while (!unlockStatus);
    this.logInfo('accounts unlocked successful');
  }

  /**
   * It iterates over accounts to get the status(Locked or Unlocked) of the accounts.
   */
  private async getAccountsStatus(noOfTries: number): Promise<boolean> {
    this.logInfo(`number of tries to fetch unlocked accounts from node is ${noOfTries}`);
    let noOfUnlockedAccounts = 0;
    let response;
    try {
      response = await this.getWallets();
    } catch (err) {
      this.logError(`error from here ${err}`);
    }
    if (response) {
      const accounts = response.result;
      for (let index = 0; index < accounts.length; index += 1) {
        if (accounts[index].status === 'Unlocked') {
          noOfUnlockedAccounts += 1;
        }
      }
      if (noOfUnlockedAccounts > 0) {
        return (noOfUnlockedAccounts === accounts.length);
      }
    }
    return false;
  }

  /**
   * It fetches the list of wallets with their status. It is only supported in Geth client.
   */
  private getWallets() {
    return new Promise((resolve, reject) => {
      this.web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'personal_listWallets',
        id: new Date().getTime(),
        params: [],
      },
      (err, res?) => {
        if (res) {
          resolve(res);
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Deploys all the contracts that are required for a new auxiliary chain to be linked to origin:
   *
   * * Anchor organization
   * * Anchor
   * * Organization for co-gateway and OST prime
   * * OST prime
   * * OST co-gateway with all its libraries:
   *     * Merkle Patricia proof
   *     * Message bus
   *     * Gateway lib
   *
   * Also links the contracts.
   */
  private async deployContracts(
    originOstGatewayAddress: string,
    originHeight: string,
    originStateRoot: string,
    originChainId?: string,
  ): Promise<{
    anchorOrganization: ContractInteract.Organization;
    anchor: ContractInteract.Anchor;
    coGatewayAndOstPrimeOrganization: ContractInteract.Organization;
    ostPrime: ContractInteract.OSTPrime;
    ostCoGateway: ContractInteract.EIP20CoGateway;
    gatewayLib: ContractInteract.GatewayLib;
    messageBus: ContractInteract.MessageBus;
    merklePatriciaProof: ContractInteract.MerklePatriciaProof;
  }> {
    this.logInfo('deploying contracts');

    /* Deployer is set as admin, so that set co-anchor transaction can be done.
     * Once setup is done, admin will be restored to actual address.
     */
    const anchorOrganization = await this.deployOrganization(
      this.initConfig.auxiliaryAnchorOrganizationOwner,
      this.txOptions.from,
      this.anchorOrganizationDeploymentNonce,
    );
    const anchor = await this.deployAnchor(
      originChainId || this.originChain,
      originHeight,
      originStateRoot,
      anchorOrganization.address,
    );
    const coGatewayAndOstPrimeOrganization = await this.deployOrganization(
      this.initConfig.auxiliaryCoGatewayAndOstPrimeOrganizationOwner,
      this.deployer,
      this.coGatewayAndOstPrimeOrganizationDeploymentNonce,
    );
    const ostPrime = await this.deployOstPrime(
      this.initConfig.originOstAddress,
      coGatewayAndOstPrimeOrganization.address,
    );
    const {
      ostCoGateway,
      gatewayLib,
      messageBus,
      merklePatriciaProof,
    } = await this.deployOstCoGateway(
      this.initConfig.originOstAddress,
      ostPrime.address,
      anchor.address,
      coGatewayAndOstPrimeOrganization.address,
      originOstGatewayAddress,
    );

    this.logInfo('setting co-gateway on ost prime');
    await ostPrime.setCoGateway(ostCoGateway.address, this.txOptions);

    return {
      anchorOrganization,
      anchor,
      coGatewayAndOstPrimeOrganization,
      ostPrime,
      ostCoGateway,
      gatewayLib,
      messageBus,
      merklePatriciaProof,
    };
  }

  /**
   * Transfers all the base tokens of the new chain to the OST prime contract.
   */
  private async transferAllOstIntoOstPrime(auxiliaryOstPrimeAddress: string): Promise<void> {
    this.logInfo('initializing ost prime with all tokens');
    const ostPrime = new ContractInteract.OSTPrime(
      this.web3,
      auxiliaryOstPrimeAddress,
    );

    // 800 mio as per definition of OST.
    const value = '800000000000000000000000000';
    await ostPrime.initialize({
      ...this.txOptions,
      value,
    });
  }

  /**
   * Proves the gateway and the stake intent on the co-gateway.
   */
  private async proveStake(
    auxiliaryOstCoGatewayAddress: string,
    nonce: string,
    hashLockSecret: string,
    proofData: Proof,
  ): Promise<void> {
    this.logInfo('proving stake');
    const hashLockHash = Web3.utils.sha3(hashLockSecret);
    const ostCoGateway = new ContractInteract.EIP20CoGateway(
      this.web3,
      auxiliaryOstCoGatewayAddress,
    );
    await ostCoGateway.proveGateway(
      proofData.blockNumber.toString(10),
      proofData.accountData,
      proofData.accountProof,
      this.txOptions,
    );
    await ostCoGateway.confirmStakeIntent(
      this.initConfig.originTxOptions.from,
      nonce,
      this.deployer,
      this.initConfig.originStakeAmount,
      this.initConfig.originStakeGasPrice,
      this.initConfig.originStakeGasLimit,
      hashLockHash,
      proofData.blockNumber.toString(10),
      proofData.storageProof,
      this.txOptions,
    );
  }

  /**
   * Nonce is often added to enforce failure when deploying in wrong order or missing a contract.
   * @returns The transaction options to use for transactions to the auxiliary chain.
   */
  private get txOptions(): Tx {
    return {
      from: this.deployer,
      gasPrice: '0',
      // This can be any arbitrarily high number as the gas price is zero and we do not want the
      // transaction to be limited by the gas allowance.
      gas: '10000000',
    };
  }

  /**
   * Creates a new genesis file for this chain and stores it in the chain data directory.
   */
  private generateGenesisFile(): void {
    this.logInfo('generating and writing genesis.json to chain directory');
    const genesis = CliqueGenesis.create(this.chainId, this.sealer, this.deployer);

    fs.writeFileSync(
      path.join(this.chainDir, 'genesis.json'),
      JSON.stringify(
        genesis,
        null,
        '  ',
      ),
    );
  }

  /**
   * Initializes a new auxiliary chain from a stored genesis in the chain data directory.
   */
  private initFromGenesis(): void {
    this.logInfo('initializing chain from genesis');
    const args = [
      'run',
      '--rm',
      '--volume', `${this.chainDir}:/chain_data`,
      `ethereum/client-go:${GETH_VERSION}`,
      '--datadir', '/chain_data',
      'init',
      '/chain_data/genesis.json',
    ];

    Shell.executeDockerCommand(args);
  }

  /**
   * Copies the chain data from the mosaic directory into this project to be committed for others
   * to connect.
   */
  private copyStateToChainsDir(): void {
    fs.ensureDirSync(Directory.getProjectUtilityChainDir(this.originChain, this.chainId));

    this.copy('geth');
    this.copy('genesis.json');
  }

  /**
   * Copies the given file from the chain data directory to the project utility chain sub-directory.
   */
  private copy(file: string): void {
    const source: string = path.join(this.chainDir, file);
    const destination: string = path.join(
      Directory.getProjectUtilityChainDir(this.originChain, this.chainId),
      file,
    );
    this.logInfo('copying chains state to utility chains directory', { source, destination });
    try {
      fs.copySync(
        source,
        destination,
      );
    } catch (error) {
      this.logError('could not copy', { source, destination, error: error.toString() });
      throw error;
    }
  }

  /**
   * Reads the sealer and deployer addresses from the keystore.
   * @returns Both addresses with leading `0x`.
   */
  private getAccounts(): string[] {
    this.logInfo('reading sealer and deployer address from disk');
    const addresses: string[] = this.readAddressesFromKeystore();
    if (addresses.length !== 2) {
      const message = 'did not find exactly two addresses in auxiliary keystore; aborting';
      Logger.error(message);
      throw new Error(message);
    }

    return addresses.map(address => `0x${address}`);
  }

  /**
   * Generates a new boot key and stores it in the chain data directory.
   */
  private generateBootKey(): string {
    this.logInfo('generating boot key');
    const bootKeyFile = 'boot.key';

    const args = [
      'run',
      '--rm',
      '--volume', `${this.chainDir}:/chain_data`,
      `ethereum/client-go:alltools-${GETH_VERSION}`,
      'bootnode',
      '--genkey', `/chain_data/${bootKeyFile}`,
    ];
    Shell.executeDockerCommand(args);

    this.bootKeyFilePath = `${this.chainDir}/${bootKeyFile}`;
    return bootKeyFile;
  }

  /**
   * @returns The raw addresses from the key store, without leading `0x`.
   */
  private readAddressesFromKeystore(): string[] {
    this.logInfo('reading addresses from keystore');
    const addresses: string[] = [];

    const filesInKeystore: string[] = fs.readdirSync(path.join(this.chainDir, 'keystore'));
    for (const file of filesInKeystore) {
      const fileContent = JSON.parse(
        fs.readFileSync(
          path.join(
            this.chainDir,
            'keystore',
            file,
          ),
          { encoding: 'utf8' },
        ),
      );
      if (fileContent.address !== undefined) {
        addresses.push(fileContent.address);
      }
    }

    return addresses;
  }

  /**
   * Deploys an organization.
   */
  private deployOrganization(
    owner: string,
    admin: string,
    nonce: number,
  ): Promise<ContractInteract.Organization> {
    this.logInfo('deploying organization', { owner, admin });
    const txOptions: Tx = {
      ...this.txOptions,
      nonce,
    };
    return Contracts.deployOrganization(this.web3, txOptions, owner, admin);
  }

  /**
   * Deploys an anchor.
   */
  private deployAnchor(
    originChainId: string,
    initialHeight: string,
    initialStateRoot: string,
    organizationAddress: string,
  ): Promise<ContractInteract.Anchor> {
    this.logInfo(
      'deploying anchor',
      {
        originChainId, initialHeight, initialStateRoot, organizationAddress,
      },
    );
    const txOptions: Tx = {
      ...this.txOptions,
      nonce: this.anchorDeploymentNonce,
    };
    return Contracts.deployAnchor(
      this.web3,
      txOptions,
      originChainId,
      initialHeight,
      initialStateRoot,
      this.initConfig.auxiliaryAnchorBufferSize,
      organizationAddress,
    );
  }

  /**
   * Deploys OST prime.
   */
  private deployOstPrime(
    ostAddress: string,
    organizationAddress: string,
  ): Promise<ContractInteract.OSTPrime> {
    this.logInfo('deploying ost prime', { ostAddress, organizationAddress });
    const txOptions: Tx = {
      ...this.txOptions,
      nonce: this.ostPrimeDeploymentNonce,
    };
    const ostPrime = Contracts.deployOstPrime(
      this.web3,
      txOptions,
      ostAddress,
      organizationAddress,
    );
    return ostPrime;
  }

  /**
   * Deploys an OST co-gateway.
   */
  private deployOstCoGateway(
    ostAddress: string,
    ostPrimeAddress: string,
    anchorAddress: string,
    organizationAddress: string,
    gatewayAddress: string,
  ): Promise<{
    gatewayLib: ContractInteract.GatewayLib;
    messageBus: ContractInteract.MessageBus;
    merklePatriciaProof: ContractInteract.MerklePatriciaProof;
    ostCoGateway: ContractInteract.EIP20CoGateway;
  }> {
    this.logInfo(
      'deploying ost co-gateway',
      {
        ostAddress, ostPrimeAddress, anchorAddress, organizationAddress, gatewayAddress,
      },
    );
    const contracts = Contracts.deployOstCoGateway(
      this.web3,
      this.txOptions,
      ostAddress,
      ostPrimeAddress,
      anchorAddress,
      this.initConfig.auxiliaryBounty,
      organizationAddress,
      gatewayAddress,
      this.initConfig.auxiliaryBurnerAddress,
    );
    return contracts;
  }

  /**
   * Logs the given message and meta data as log level info.
   */
  private logInfo(message: string, metaData: any = {}): void {
    Logger.info(message, { chain: 'auxiliary', chainId: this.chainId, ...metaData });
  }

  /**
   * Logs the given message and meta data as log level error.
   */
  private logError(message: string, metaData: any = {}): void {
    Logger.error(message, { chain: 'auxiliary', chainId: this.chainId, ...metaData });
  }

  /**
   * @returns A promise that resolves after the given number of milliseconds.
   */
  private static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
