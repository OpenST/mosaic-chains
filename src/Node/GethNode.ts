import * as fs from 'fs-extra';
import * as path from 'path';
import Node from './Node';
import Shell from '../Shell';
import Directory from '../Directory';
import ChainInfo from './ChainInfo';
import CliqueGethGenesis from '../NewChain/Genesis/Clique/Geth';
import NodeDescription from './NodeDescription';
import Logger from '../Logger';

import Web3 = require('web3');

const GETH_VERSION = 'v1.9.5';
const DOCKER_GETH_IMAGE = `ethereum/client-go:${GETH_VERSION}`;
export const DEV_CHAIN_DOCKER = 'mosaicdao/dev-chains:1.0.4';
/**
 * Represents a geth node that runs in a docker container.
 */
export default class GethNode extends Node {
  private maxTriesToUnlockAccounts = 5;

  private bootKeyFilePath: string;

  /** Path of bootnodes file. */
  public bootNodesFile?: string;

  /** RPC and IPC endpoint of clef */
  public clefSigner?: string;

  /** if set, code will perform geth init before starting node. Defaults to false. */
  public forceInit?: boolean;

  public constructor(nodeDescription: NodeDescription) {
    super(nodeDescription);
    this.bootNodesFile = nodeDescription.bootNodesFile;
    this.clefSigner = nodeDescription.clefSigner;
    this.forceInit = nodeDescription.forceInit;
  }

  /** A list of bootnodes that are passed to the geth container. */
  private bootnodes: string = '';

  public generateAccounts(count: number): string[] {
    const args = [
      'run',
      '--rm',
      '--volume', `${this.chainDir}:/chain_data`,
      '--volume', `${this.password}:/password.txt`,
      `ethereum/client-go:${GETH_VERSION}`,
      'account',
      'new',
      '--password', '/password.txt',
      '--datadir', '/chain_data',
    ];

    // The command is executed count number of times. Each time the command is run,
    // it creates one new account. This is also the reason why the password file must contain the
    // same password count number of times, once per line. All accounts get created with the password on the first
    // line of the file, but all of them are read for unlocking when the node is later started.
    for (let i = 1; i <= count; i++) {
      Shell.executeDockerCommand(args);
    }

    const addresses: string[] = this.readAddressesFromKeystore();
    if (addresses.length !== count) {
      const message = 'did not find exactly two addresses in auxiliary keystore; aborting';
      Logger.error(message);
      throw new Error(message);
    }

    return addresses.map(address => `0x${address}`);
  }

  /**
   * Generates genesis file data
   */
  public generateGenesisFile(chainId: string): any {
    return CliqueGethGenesis.create(chainId);
  }

  /**
   * Appends blocks specific to generated addresses to existing genesis data
   */
  public appendAddressesToGenesisFile(genesis: any, sealer: string, deployer: string): any {
    return CliqueGethGenesis.appendAddresses(genesis, sealer, deployer);
  }

  /**
   * Initializes a new auxiliary chain from a stored genesis in the chain data directory.
   */
  public initFromGenesis(): void {
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
   * @returns The raw addresses from the key store, without leading `0x`.
   */
  private readAddressesFromKeystore(): string[] {
    this.logInfo('reading addresses from keystore');
    const addresses: string[] = [];

    const filesInKeystore: string[] = fs.readdirSync(this.keysFolder);
    for (const file of filesInKeystore) {
      const fileContent = JSON.parse(
        fs.readFileSync(
          path.join(
            this.keysFolder,
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
   * Starts the container that runs this chain node.
   */
  public start(): void {
    super.initializeDirectories();
    super.ensureNetworkExists();

    let args = [];
    if (ChainInfo.isDevOriginChain(this.chain)
      || ChainInfo.isDevOriginChain(this.originChain)
    ) {
      args = this.devGethArgs(this.chain);
    } else {
      if (this.originChain) {
        // init geth directory ONLY for auxiliary chains
        this.initializeGethDirectory();
      }
      args = this.defaultDockerGethArgs;
    }
    this.logInfo('starting geth node');
    Shell.executeDockerCommand(args);
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

  public async startSealer(sealer: string): Promise<void> {
    super.initializeDirectories();
    super.ensureNetworkExists();

    // We always start a new chain with gas price zero.
    const gasPrice = '0';
    // 10 mio. as per `CliqueGethGenesis.ts`.
    const targetGasLimit = '10000000';

    const bootKeyFile = this.generateBootKey();

    this.logInfo(`starting geth sealer node with sealer: ${sealer}`);
    let args = this.defaultDockerGethArgs;
    args = args.concat([
      '--syncmode', 'full',
      '--gasprice', gasPrice,
      '--targetgaslimit', targetGasLimit,
      '--mine',
      '--nodekey', `/chain_data/${bootKeyFile}`,
      '--allow-insecure-unlock',
    ]);

    Shell.executeDockerCommand(args);
  }

  /**
   * returns path to folder where keystore files are written to disk
   */
  public get keysFolder(): string {
    return path.join(this.chainDir, 'keystore');
  }

  /**
   * returns genesis file name
   */
  public get genesisFileName(): string {
    return 'genesis.json';
  }

  /**
   * It polls every 4-secs to fetch the list of wallets.
   * It logs error when connection is not established even after max tries.
   */
  public async verifyAccountsUnlocking(web3: Web3): Promise<void> {
    let totalWaitTimeInSeconds = 0;
    const timeToWaitInSecs = 4;
    let unlockStatus: boolean;
    do {
      await GethNode.sleep(timeToWaitInSecs * 1000);
      totalWaitTimeInSeconds += timeToWaitInSecs;
      if (totalWaitTimeInSeconds > (this.maxTriesToUnlockAccounts * timeToWaitInSecs)) {
        throw new Error('node did not unlock accounts in time');
      }
      unlockStatus = await this.getAccountsStatus(web3, totalWaitTimeInSeconds / timeToWaitInSecs);
    } while (!unlockStatus);
    this.logInfo('accounts unlocked successful');
  }

  /**
   * It iterates over accounts to get the status(Locked or Unlocked) of the accounts.
   */
  private async getAccountsStatus(web3: Web3, noOfTries: number): Promise<boolean> {
    this.logInfo(`number of tries to fetch unlocked accounts from node is ${noOfTries}`);
    let noOfUnlockedAccounts = 0;
    let response;
    try {
      response = await this.getWallets(web3);
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
  private getWallets(web3: Web3) {
    return new Promise((resolve, reject) => {
      web3.currentProvider.send({
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
   * Read the bootnodes from the utility chain subdirectory.
   */
  public readBootnodes(): void {
    // Added try catch, because this is called even in case of mosaic stop.
    // This is needed only while mosaic start.

    let bootNodePath;
    if (this.bootNodesFile) {
      const bootFileExists = fs.pathExistsSync(this.bootNodesFile);
      if (!bootFileExists) {
        const message = `Bootnode file ${this.bootNodesFile} does not exist`;
        Logger.error(message);
        throw new Error(message);
      }
      bootNodePath = this.bootNodesFile;
      this.logInfo(`Reading bootnodes from file ${bootNodePath}`);
    } else {
      bootNodePath = this.originChain
        ? path.join(
          Directory.projectRoot,
          'chains',
          this.originChain,
          this.chain,
          'bootnodes',
        )
        : path.join(
          Directory.projectRoot,
          'chains',
          this.chain,
          'bootnodes',
        );
    }

    try {
      this.logInfo('reading bootnodes from disk');
      this.bootnodes = `${fs.readFileSync(
        bootNodePath,
        {
          encoding: 'utf8',
        },
      ).trim()}`;
    } catch (e) {
      this.logInfo('Boot nodes not present');
    }
  }

  private getDefaultDockerArgs(): string[] {
    let args = [
      'run',
    ];

    if (!this.keepAfterStop) {
      args = args.concat('--rm');
    }

    args = args.concat([
      '--network', Node.network,
      '--detach',
      '--name', this.containerName,
      '--publish', `${this.port}:${this.port}`,
      '--publish', `${this.rpcPort}:8545`,
      '--publish', `${this.websocketPort}:8546`,
    ]);

    return args;
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
   * It initializes the geth directory from genesis file if not already done.
   */
  private initializeGethDirectory(): void {
    if (this.forceInit || !this.isGethAlreadyInitiliazed()) {
      const { gethInitArgs } = this;
      this.logInfo('initializing geth directory');
      Shell.executeDockerCommand(gethInitArgs);
    } else {
      this.logInfo('skipping directory initialization as it is already done');
    }
  }

  /**
   * It verifies whether geth initialization already or not.
   * @returns true if geth is already initialized otherwise false.
   */
  private isGethAlreadyInitiliazed(): boolean {
    const chainGethPath = path.join(this.chainDir, 'geth');
    return fs.existsSync(chainGethPath);
  }

  /**
   * It provides parameters required for geth init command.
   * @returns geth init arguments.
   */
  private get gethInitArgs(): string [] {
    const args = [
      'run',
      '--rm',
      '--volume', `${this.genesisFilePath()}:/genesis.json`,
      '--volume', `${this.chainDir}:/chain_data`,
      DOCKER_GETH_IMAGE,
      'init',
      '/genesis.json',
      '--datadir', '/chain_data',
    ];

    return args;
  }

  private get defaultDockerGethArgs(): string[] {
    let args = this.getDefaultDockerArgs();
    args = args.concat([
      '--volume', `${this.chainDir}:/chain_data`,
    ]);
    if (this.password !== '') {
      args = args.concat([
        '--volume', `${this.password}:/password.txt`,
      ]);
    }
    args = args.concat([DOCKER_GETH_IMAGE]);
    args = args.concat(this.networkOption());
    args = args.concat([
      '--datadir', './chain_data',
      '--port', `${this.port}`,
      '--rpc',
      '--rpcaddr', '0.0.0.0',
      '--rpcvhosts=*',
      '--rpccorsdomain=*',
      '--rpcapi', 'eth,net,web3,network,debug,txpool,admin,personal',
      '--rpcport', '8545',
      '--ws',
      '--wsaddr', '0.0.0.0',
      '--wsport', '8546',
      '--wsapi', 'eth,net,web3,network,debug,txpool,admin,personal',
      '--wsorigins=*',
    ]);
    if (this.clefSigner) {
      args = args.concat([
        `--signer=${this.clefSigner}`,
      ]);
    }
    if (this.bootnodes !== '') {
      args = args.concat([
        '--bootnodes', this.bootnodes.trim(),
      ]);
    }

    if (this.unlock !== '') {
      args = args.concat([
        '--unlock', this.unlock,
      ]);
    }

    if (this.password !== '') {
      args = args.concat([
        '--password', '/password.txt',
      ]);
    }

    return args;
  }

  private devGethArgs(chain): string[] {
    let args = this.getDefaultDockerArgs();

    args = args.concat([
      '--volume', `${this.mosaicDir}/${this.originChain || this.chain}:/root`,
    ]);

    const devChainCommandParam = ChainInfo.isDevOriginChain(chain) ? 'origin' : 'auxiliary';
    args = args.concat([
      DEV_CHAIN_DOCKER,
      devChainCommandParam,
    ]);

    return args;
  }

  /**
   * @return array of network args which become part of geth start command
   */
  private networkOption(): string[] {
    switch (this.chain) {
      case 'goerli':
        return ['--goerli'];
      case 'ropsten':
        return ['--testnet'];
      case 'ethereum':
        return ['--networkid', '1'];
      default:
        // aux chains go into this block
        return ['--networkid', `${this.chain}`];
    }
  }

  /**
   * @returns A promise that resolves after the given number of milliseconds.
   */
  private static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Logs the given message and meta data as log level error.
   */
  private logError(message: string, metaData: any = {}): void {
    Logger.error(message, { chain: this.chain, originChain: this.originChain, ...metaData });
  }
}
