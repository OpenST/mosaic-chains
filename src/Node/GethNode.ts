import * as fs from 'fs-extra';
import * as path from 'path';
import Node from './Node';
import Shell from '../Shell';
import Directory from '../Directory';
import ChainInfo from './ChainInfo';

const DEV_CHAIN_DOCKER = 'mosaicdao/dev-chains';
/**
 * Represents a geth node that runs in a docker container.
 */
export default class GethNode extends Node {
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
    ]);

    Shell.executeDockerCommand(args);
  }

  /**
   * Read the bootnodes from the utility chain subdirectory.
   */
  public readBootnodes(): void {
    // Added try catch, because this is called even in case of mosaic stop.
    // This is needed only while mosaic start.
    try {
      this.logInfo('reading bootnodes from disk');
      this.bootnodes = fs.readFileSync(
        path.join(
          Directory.projectRoot,
          'chains',
          this.originChain,
          this.chain,
          'bootnodes',
        ),
        {
          encoding: 'utf8',
        },
      );
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
      'ethereum/client-go:v1.8.23',
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

    args = args.concat(['ethereum/client-go:v1.8.23']);
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
        // Geth is not able to sync ropsten without providing custom bootnodes
        // Bootnodes of ropsten.
        // Refer https://gist.githubusercontent.com/rfikki/c895641b6405c082f68bcf139cf2f7ae/raw/8af5efb74db7be0c36003a81d0363b4e87fb8bbb/ropsten-peers-latest.txt
        return [
          '--testnet',
          '--bootnodes',
          'enode://a60baadd908740e1fed9690ec399db6cbec47244acecd845a3585ec560f89d9ab96400004412b4dbf59c4e56758824e606ded5be97376ffc012a62869877f9af@155.138.211.79:30303,' +
          'enode://3869e363263a54cd930960d485338a7ef1b5b6cd61a4484c81b31f48a2b68200783472a2e7f89c31a86f087e377050720a91cfa82903bd8d45456b6a5e0ffe5f@54.149.176.240:30303,' +
          'enode://24cabc9618a4bd4ef3ccfb124b885ddfc352b87bd9f30c4f98f4791b6e81d58824f2c8b451bbdbac25a1b6311b9e12e50775ee49cdb1847c3132b4abfa7842c2@54.39.102.3:30302,' +
          'enode://eecaf5852a9f0973d20fd9cb20b480ab0e47fe4a53a2395394e8fe618e8c9e5cb058fd749bf8f0b8483d7dc14c2948e18433490f7dd6182455e3f046d2225a8c@52.221.19.47:30303'
        ];
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
