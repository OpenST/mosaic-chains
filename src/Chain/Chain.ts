import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import Directory from '../Directory';
import Logger from '../Logger';
import Shell from '../Shell';

/**
 * Represents a chain that is managed by docker.
 */
export default abstract class Chain {
  public chainId: string;
  public dataDir: string;
  public abstract chainPath: string;
  public port: number;
  public rpcPort: number;
  public websocketPort: number;

  /**
   * Docker container names will have this prefix.
   * @returns The prefix.
   */
  public static get prefix(): string {
    return 'mosaic_';
  }

  /**
   * Docker containers will spawn in this docker network.
   * @returns The network name.
   */
  public static get network(): string {
    return 'mosaic';
  }

  constructor(
    chainId: string,
    dataDir: string = path.join(os.homedir(), '.mosaic'),
    port: number = 30303,
    rpcPort: number = 8545,
    websocketPort: number = 8646,
  ) {
    this.chainId = chainId;
    this.dataDir = Directory.sanitize(dataDir);
    this.port = port;
    this.rpcPort = rpcPort;
    this.websocketPort = websocketPort;
  }

  /**
   * Starts the docker container that runs this chain.
   */
  public abstract start(): void;

  /**
   * Stops the docker container that runs this chain.
   */
  public stop(): void {
    this.logInfo('attempting to stop chain container');
    const args = [
      'stop',
      `${Chain.prefix}${this.chainId}`,
    ];

    Shell.executeDockerCommand(args);
  }

  /**
   * Creates the data directory if it does not exist.
   */
  protected initializeDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      this.logInfo(`${this.dataDir} does not exist; initializing`);
      fs.mkdirSync(this.dataDir);
    }
  }

  /**
   * Logs the given message as `info`. Adds the chain id to the metadata of the log message.
   * @param message The message to log.
   */
  protected logInfo(message: string): void {
    Logger.info(message, { chain: this.chainId });
  }
}
