import * as fs from 'fs';
import * as path from 'path';
import Chain from './Chain';
import Shell from '../Shell';

/**
 * An "official" chain is any chain that is officially supported by the parity node.
 * Official chains run in a parity container.
 */
export default class OfficialChain extends Chain {
  public chainPath: string;

  constructor(
    chainId: string,
    dataDir: string = '~/.mosaic',
    port: number = 30303,
    rpcPort: number = 8545,
    websocketPort: number = 8646,
  ) {
    super(
      chainId,
      dataDir,
      port,
      rpcPort,
      websocketPort,
    );

    this.chainPath = path.join(this.dataDir, this.chainId);
  }

  /**
   * Starts the container that runs this chain node.
   */
  public start(): void {
    this.logInfo('starting parity container');
    this.initializeDirectories();

    const args = [
      'run',
      '--network', `${Chain.network}`,
      '--rm',
      '-d',
      '--name', `${Chain.prefix}${this.chainId}`,
      '-p', `${this.port}:30303`,
      '-p', `${this.rpcPort}:8545`,
      '-p', `${this.websocketPort}:8546`,
      '-v', `${this.chainPath}:/home/parity/.local/share/io.parity.ethereum/`,
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
    ];

    Shell.executeDockerCommand(args);
  }

  /**
   * Initialize directories required by parity to run.
   */
  private initializeDirectories(): void {
    super.initializeDataDir();

    if (!fs.existsSync(this.chainPath)) {
      this.logInfo(`${this.chainPath} does not exist; initializing`);
      fs.mkdirSync(this.chainPath);
    }
  }
}
