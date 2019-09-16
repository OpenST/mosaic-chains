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
    if (this.chain === 'dev' || this.originChain === 'dev') {
      args = this.devGethArgs(this.chain);
    } else {
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
    args = args.concat([
      'ethereum/client-go:v1.8.23',
      '--networkid', this.chain,
      '--datadir', './chain_data',
      '--port', `${this.port}`,
      '--rpc',
      '--rpcaddr', '0.0.0.0',
      '--rpcvhosts', '*',
      '--rpcapi', 'eth,net,web3,network,debug,txpool,admin,personal',
      '--rpcport', '8545',
      '--ws',
      '--wsaddr', '0.0.0.0',
      '--wsport', '8546',
      '--wsapi', 'eth,net,web3,network,debug,txpool,admin,personal',
      '--wsorigins', '*',
    ]);

    if (this.bootnodes !== '') {
      args = args.concat([
        '--bootnodes', this.bootnodes,
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
    let volume = '';
    let devChainCommandParam = '';

    const isDevOriginChain = ChainInfo.isDevOriginChain(chain);
    if (isDevOriginChain) {
      volume = `${this.chainDir}:/origin_volume`;
      devChainCommandParam = 'origin';
    } else {
      volume = `${this.chainDir}:/auxiliary_volume`;
      devChainCommandParam = 'auxiliary';
    }
    args = args.concat([
      '--volume', volume,
    ]);
    args = args.concat([
      DEV_CHAIN_DOCKER,
      devChainCommandParam,
    ]);

    return args;
  }

  /**
   * Copies the initialized geth repository to the data directory if it does not exist.
   */
  private initializeDirectories(): void {
    super.initializeDataDir();

    if (!fs.existsSync(this.chainDir)) {
      this.logInfo(`${this.chainDir} does not exist; initializing`);
      fs.mkdirpSync(this.chainDir);
      const sourcePath = path.join(
        Directory.projectRoot,
        'chains',
        this.originChain,
        this.chain,
        'geth',
      );
      if (fs.existsSync(sourcePath)) {
        fs.copySync(
          sourcePath,
          path.join(this.chainDir, 'geth'),
        );
      }
    }
  }
}
