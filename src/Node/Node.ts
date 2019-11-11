import * as fs from 'fs-extra';
import * as path from 'path';
import Logger from '../Logger';
import Shell from '../Shell';
import NodeDescription from './NodeDescription';
import PublishMosaicConfig from '../Config/PublishMosaicConfig';

/**
 * Represents a chain that is managed by docker.
 */
export default abstract class Node {
  /** The chain identifier identifies the chain this node should run. For example ropsten or 200. */
  protected chain: string;

  /** The base directory of the mosaic chains that will hold the chains' data in a subdirectory. */
  protected mosaicDir: string;

  /** The directory where the chain data is store that this node will use. */
  protected chainDir: string;

  /** Docker will publish this port on the host. */
  protected port: number;

  /** Docker will publish this RPC port on the host. */
  protected rpcPort: number;

  /** Docker will publish this websocket port on the host. */
  protected websocketPort: number;

  /** The name of this docker container. */
  protected containerName: string;

  /** If set to true, the container is not deleted when stopped. */
  protected keepAfterStop: boolean;

  /** A comma separated list of addresses that get unlocked while the process is running. */
  protected unlock: string;

  /** The path to the password file to unlock the accounts given in unlock. */
  protected password: string;

  /**
   * Identifier for origin chain.
   * This needs to be passed if auxiliary chain needs to be started.
   */
  public originChain: string;

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

  public constructor(nodeDescription: NodeDescription) {
    this.chain = nodeDescription.chain;
    this.mosaicDir = nodeDescription.mosaicDir;
    this.port = nodeDescription.port;
    this.rpcPort = nodeDescription.rpcPort;
    this.websocketPort = nodeDescription.websocketPort;
    this.keepAfterStop = nodeDescription.keepAfterStop;
    this.unlock = nodeDescription.unlock;
    this.password = nodeDescription.password;
    this.originChain = nodeDescription.originChain;

    if (this.originChain === '') {
      this.chainDir = path.join(this.mosaicDir, this.chain, `origin-${nodeDescription.client}`);
    } else {
      this.chainDir = path.join(this.mosaicDir, this.originChain, this.chain);
    }
    this.containerName = `${Node.prefix}${this.chain}`;
  }

  public getChain(): string {
    return this.chain;
  }

  public getMosaicDir(): string {
    return this.mosaicDir;
  }

  public getChainDir(): string {
    return this.chainDir;
  }

  public getPort(): number {
    return this.port;
  }

  public getRpcPort(): number {
    return this.rpcPort;
  }

  public getWebsocketPort(): number {
    return this.websocketPort;
  }

  public getContainerName(): string {
    return this.containerName;
  }

  public isKeptAfterStop(): boolean {
    return this.keepAfterStop;
  }

  /**
   * Create a docker network if network doesn't exists.
   */
  public ensureNetworkExists(): void {
    // `-w` in grep is used to match the exact string.
    //  Command for creating network only if network doesn't exists.
    const createNetwork = `docker network ls | grep -w ${Node.network} || docker network create ${Node.network}`;
    Shell.executeInShell(createNetwork);
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
      this.containerName,
    ];

    Shell.executeDockerCommand(args);
  }

  /**
   * 1. Creates the mosaic data directory if it does not exist.
   * 2. Publishes mosaic configs for existing chains
   */
  protected initializeDataDir(): void {
    if (!fs.existsSync(this.mosaicDir)) {
      this.logInfo(`${this.mosaicDir} does not exist; initializing`);
      fs.mkdirSync(this.mosaicDir, { recursive: true });
    }

    // If the `this.originChain` is not present, then `this.chain` is the
    // origin chain itself.
    PublishMosaicConfig.tryPublish(this.originChain || this.chain);
  }

  /**
   * Logs the given message as `info`. Adds the chain id to the metadata of the log message.
   * @param message The message to log.
   */
  protected logInfo(message: string): void {
    Logger.info(message, { chain: this.chain });
  }
}
