import * as fs from 'fs-extra';
import * as path from 'path';
import Chain from './Chain';
import Shell from '../Shell';
import Directory from '../Directory';

/**
 * The metadata of a utility chain.
 */
interface Metadata {
  network: string;
  bootnodes: string;
}

/**
 * Represents a utility chain node that runs in a docker container.
 */
export default class UtilityChain extends Chain {
  public chainPath: string;
  public metadata: Metadata;

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

    this.chainPath = path.join(this.dataDir, `utility_chain_${this.chainId}`);
    this.metadata = this.readMetadata();
  }

  /**
   * Starts the container that runs this chain node.
   */
  public start(): void {
    this.initializeDirectories();

    this.logInfo('attempting to start geth container to run utility chain');
    const args = [
      'run',
      '--network', `${Chain.network}`,
      '--rm',
      '-d',
      '--name', `${Chain.prefix}${this.chainId}`,
      '-p', `${this.port}:30303`,
      '-p', `${this.rpcPort}:8545`,
      '-p', `${this.websocketPort}:8546`,
      '-v', `${this.chainPath}:/chain_data`,
      'ethereum/client-go:v1.8.23',
      '--networkid', `${this.metadata.network}`,
      '--datadir', './chain_data',
      '--port', '30303',
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
      '--bootnodes', `${this.metadata.bootnodes}`,
    ];

    Shell.executeDockerCommand(args);
  }

  /**
   * Copies the initialized geth repository to the data directory if it does not exist.
   */
  private initializeDirectories(): void {
    super.initializeDataDir();

    if (!fs.existsSync(this.chainPath)) {
      this.logInfo(`${this.chainPath} does not exist; initializing`);
      fs.mkdirSync(this.chainPath);
      fs.copySync(
        path.join(
          Directory.projectRoot,
          'utility_chains',
          `utility_chain_${this.chainId}`,
          'geth',
        ),
        path.join(this.chainPath, 'geth'),
      );
    }
  }

  /**
   * Read the metadata from the utility chain subdirectory.
   */
  private readMetadata(): Metadata {
    return JSON.parse(
      fs.readFileSync(
        path.join(
          Directory.projectRoot,
          'utility_chains',
          `utility_chain_${this.chainId}`,
          'environment.json',
        ),
        {
          encoding: 'utf8',
        }
      ),
    );
  }
}
