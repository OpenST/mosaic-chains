import * as fs from 'fs';
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

    let args = [
      'run',
    ];

    if (!this.keepAfterStop) {
      args = args.concat('--rm');
    }

    args = args.concat([
      '--network', `${Node.network}`,
      '--detach',
      '--name', `${this.containerName}`,
      '--publish', `${this.port}:30303`,
      '--publish', `${this.rpcPort}:8545`,
      '--publish', `${this.websocketPort}:8546`,
      '--volume', `${this.chainDir}:/home/parity/.local/share/io.parity.ethereum/`,
      'parity/parity:v2.3.4',
      '--chain', `${this.chainId}`,
      '--base-path', '/home/parity/.local/share/io.parity.ethereum/',
      '--jsonrpc-apis', 'all',
      '--jsonrpc-interface', 'all',
      '--jsonrpc-experimental',
      '--ws-port', '8546',
      '--ws-interface', 'all',
      '--ws-apis', 'all',
      '--ws-origins', 'all',
      '--ws-hosts', 'all',
    ]);

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
