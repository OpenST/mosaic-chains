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
    let args = super.setup();
    this.initializeDirectories();

    this.logInfo('starting parity container');

    args = args.concat([
      'parity/parity:v2.3.4',
      '--chain', this.chainId,
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
