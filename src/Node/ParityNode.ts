import * as fs from 'fs';
import * as os from 'os';
import Node from './Node';
import Shell from '../Shell';
import Directory from '../Directory';
import * as path from 'path';

/**
 * Represents a parity node that runs in a docker container.
 */
export default class ParityNode extends Node {
  /**
   * Starts the container that runs this chain node.
   */
  public start(): void {
    this.logInfo('starting parity container');
    this.initializeDirectories();
    super.ensureNetworkExists();

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
      '--volume', `${this.chainDir}:/home/parity/.local/share/io.parity.ethereum`,
    ]);

    if (this.originChain) {
      const genesisFilePath = path.join(
        Directory.projectRoot,
        'chains',
        this.originChain,
        this.chain,
        'parity.json',
      );
      args = args.concat([
        '--volume', `${genesisFilePath}:/home/parity/parity.json`,
      ]);
    }

    // Running the parity process inside the container as the same user id that is executing this
    // script.
    // This is required, because otherwise the parity process will not be able to write to the
    // mounted directory. The parity process inside the container is not run as root (as usual),
    // but instead runs with uid/guid 1000/1000 by default. This option overrides that default
    // behavior so that the parity process can write to its mounted chain directory in all
    // environments. This was introduced after failing tests on Travis CI.
    const userInfo = os.userInfo();
    args = args.concat([
      '--user', `${userInfo.uid}:${userInfo.gid}`,
    ]);

    if (this.password !== '') {
      args = args.concat([
        '--volume', `${this.password}:/home/parity/password.txt`,
      ]);
    }

    args = args.concat([
      'parity/parity:v2.5.11-stable',
      '--base-path=/home/parity/.local/share/io.parity.ethereum/',
      `--port=${this.port}`,
      '--jsonrpc-port=8545',
      '--jsonrpc-apis=all',
      '--jsonrpc-interface=all',
      '--jsonrpc-experimental',
      '--ws-port=8546',
      '--ws-interface=all',
      '--ws-apis=all',
      '--ws-origins=all',
      '--ws-hosts=all',
    ]);

    const chainParam = this.originChain ? '/home/parity/parity.json' : this.chain;
    args = args.concat([
      `--chain=${chainParam}`,
    ]);

    if (this.unlock !== '') {
      args = args.concat([
        '--unlock', this.unlock,
        '--password', '/home/parity/password.txt',
      ]);
    }
    Shell.executeDockerCommand(args);
  }

  /**
   *  This returns boot node of the auxiliary chain.
   */
  public getBootNode(): string {
    throw 'to be implemented';
  }

  public startSealer(): void {
    throw 'to be implemented';
  }

  /**
   * Initialize directories required by parity to run.
   */
  private initializeDirectories(): void {
    super.initializeDataDir();

    if (!fs.existsSync(this.chainDir)) {
      this.logInfo(`${this.chainDir} does not exist; initializing`);
      fs.mkdirSync(this.chainDir, { recursive: true });
    }
  }
}
