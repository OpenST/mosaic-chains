import * as fs from 'fs';
import * as os from 'os';
import Node from './Node';
import Shell from '../Shell';

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
      '--volume', `${this.chainDir}:/home/parity/.local/share/io.parity.ethereum/`,
    ]);

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
      'parity/parity:v2.5.5-stable',
      `--chain=${this.chain}`,
      '--base-path=/home/parity/.local/share/io.parity.ethereum/',
      `--port=${this.port}`,
      '--jsonrpc-apis=all',
      '--jsonrpc-interface=all',
      '--jsonrpc-experimental',
      '--ws-port=8546',
      '--ws-interface=all',
      '--ws-apis=all',
      '--ws-origins=all',
      '--ws-hosts=all',
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
   * Initialize directories required by parity to run.
   */
  private initializeDirectories(): void {
    super.initializeDataDir();

    if (!fs.existsSync(this.chainDir)) {
      this.logInfo(`${this.chainDir} does not exist; initializing`);
      fs.mkdirSync(this.chainDir);
    }
  }
}
