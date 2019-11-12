import * as fs from 'fs-extra';
import * as path from 'path';
import Node from './Node';
import Shell from '../Shell';
import Directory from '../Directory';
import ChainInfo from './ChainInfo';
import NodeDescription from './NodeDescription';
import Logger from '../Logger';

const DOCKER_GETH_IMAGE = 'ethereum/client-go:v1.9.5';
export const DEV_CHAIN_DOCKER = 'mosaicdao/dev-chains:1.0.3';
/**
 * Represents a geth node that runs in a docker container.
 */
export default class GethNode extends Node {
  /** Path of bootnodes file. */
  public bootNodesFile?: string;

  /** RPC and IPC endpoint of clef */
  public clefSigner?: string;


  public constructor(nodeDescription: NodeDescription) {
    super(nodeDescription);
    this.bootNodesFile = nodeDescription.bootNodesFile;
    this.clefSigner = nodeDescription.clefSigner;
  }

  /** A list of bootnodes that are passed to the geth container. */
  private bootnodes: string = '';

  /**
   * Starts the container that runs this chain node.
   */
  public start(): void {
    this.initializeDirectories();
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

  public startSealer(gasPrice: string, targetGasLimit: string, bootKey: string): void {
    this.initializeDirectories();
    super.ensureNetworkExists();

    this.logInfo('starting geth sealer node');
    let args = this.defaultDockerGethArgs;
    args = args.concat([
      '--syncmode', 'full',
      '--gasprice', gasPrice,
      '--targetgaslimit', targetGasLimit,
      '--mine',
      '--nodekey', `/chain_data/${bootKey}`,
      '--allow-insecure-unlock',
    ]);

    Shell.executeDockerCommand(args);
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
   * It initializes the geth directory from genesis file if not already done.
   */
  private initializeGethDirectory(): void {
    if (!this.isGethAlreadyInitiliazed()) {
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
    const genesisFilePath = path.join(
      Directory.projectRoot,
      'chains',
      this.originChain,
      this.chain,
      'genesis.json',
    );

    const args = [
      'run',
      '--rm',
      '--volume', `${genesisFilePath}:/genesis.json`,
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
   * Creates the directory for the chain.
   */
  protected initializeDirectories(): void {
    super.initializeDataDir();

    if (!fs.existsSync(this.chainDir)) {
      this.logInfo(`${this.chainDir} does not exist; initializing`);
      fs.mkdirpSync(this.chainDir);
    }
  }
}
