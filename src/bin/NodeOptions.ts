import Logger from '../Logger';
import Directory from '../Directory';
import Integer from '../Integer';
import ChainInfo from '../Node/ChainInfo';

// These defaults will be used if the relevant option is not given on the command line.
const DEFAULT_MOSAIC_DIR = Directory.getDefaultMosaicDataDir;
const DEFAULT_PORT = 30000;
const DEFAULT_RPC_PORT = 40000;
const DEFAULT_WS_PORT = 50000;

/**
 * Command line options for running an ethereum node.
 */
export default class NodeOptions {
  /** The mosaic directory to use which holds the chains' subdirectories. */
  public mosaicDir: string;

  /** The port of the ethereum node that docker publishes on the host. */
  public port: number;

  /** The rpc port of the ethereum node that docker publishes on the host. */
  public rpcPort: number;

  /** The websocket port of the ethereum node that docker publishes on the host. */
  public websocketPort: number;

  /** If set to true, the container will not be deleted when it is stopped. Defaults to false. */
  public keepAfterStop: boolean;

  /** A comma-separated list of accounts to unlock when starting the node. */
  public unlock: string;

  /**
   * Path to a password file with one line per unlocked account.
   * We have to use a password file when unlocking as we cannot provide the password on the command
   * line when running the docker container as a daemon in the background.
   */
  public password: string;

  /**
   * Identifier for origin chain.
   * This needs to be passed if auxiliary chain needs to be started.
   */
  public originChain: string;

  /** List of boot nodes to start the node */
  public bootNodesFile: string;

  /** RPC and IPC endpoint of clef */
  public clefSigner?: string;

  /**
   * @param options The options from the command line.
   */
  constructor(options: {
    mosaicDir: string;
    port: string;
    rpcPort: string;
    websocketPort: string;
    keepAfterStop: boolean;
    unlock: string;
    password: string;
    originChain: string;
    bootNodesFile: string;
    clefSigner: string;
  }) {
    Object.assign(this, options);
    this.bootNodesFile = options.bootNodesFile;
    this.clefSigner = options.clefSigner;
  }

  /**
   * Adds the common node options to a command. Does not include unlock and password. Add these
   * separately if you need them.
   * @param command The command where to add the options.
   * @returns The command with the options added.
   */
  public static addCliOptions(command): any {
    command
      .option('-o,--origin <string>', 'identifier for origin chain. To be passed while starting auxiliary chain')
      .option('-c,--client <string>', 'identifier for client (geth/parity). To be passed while starting origin chain')
      .option('-d,--mosaic-dir <dir>', 'a path to a directory where the chain data will be stored', DEFAULT_MOSAIC_DIR)
      .option('-p,--port <port>', 'the port to use for forwarding from host to container', Integer.parseString)
      .option('-r,--rpc-port <port>', 'the RPC port to use for forwarding from host to container', Integer.parseString)
      .option('-w,--ws-port <port>', 'the WS port to use for forwarding from host to container', Integer.parseString)
      .option('-k,--keep', 'if set, the container will not automatically be deleted when stopped');
    return command;
  }

  /**
  * Parses the commander options and returns an Options object.
  * @param options Options as they are given by commander.
  * @param chain Chain identifier.
  * @returns The parsed options with defaults for options that are missing from the command line.
  */
  public static parseOptions(options, chain): NodeOptions {
    const chainIdNumber = ChainInfo.getChainId(chain);
    const parsedOptions: NodeOptions = new NodeOptions({
      mosaicDir: options.mosaicDir || DEFAULT_MOSAIC_DIR,
      port: options.port || Number.parseInt(chainIdNumber) + DEFAULT_PORT,
      rpcPort: options.rpcPort || Number.parseInt(chainIdNumber) + DEFAULT_RPC_PORT,
      websocketPort: options.wsPort || Number.parseInt(chainIdNumber) + DEFAULT_WS_PORT,
      keepAfterStop: !!options.keep,
      unlock: options.unlock || '',
      password: options.password || '',
      originChain: options.origin || '',
      bootNodesFile: options.bootnodes,
      clefSigner: options.clefSigner,
    });

    parsedOptions.mosaicDir = Directory.sanitize(parsedOptions.mosaicDir);

    if (parsedOptions.password !== '') {
      parsedOptions.password = Directory.sanitize(parsedOptions.password);
    }

    if (parsedOptions.unlockOrPasswordWithoutTheOther()) {
      Logger.error('cannot use --unlock or --password without the other');
      process.exit(1);
    }

    return parsedOptions;
  }


  /**
   * Checks if unlock or password were given as a command line option but not the other.
   * You have to give both options or none of them.
   * @param options The parsed command line options.
   * @returns True if one option was given but not the other.
   */
  public unlockOrPasswordWithoutTheOther(): boolean {
    const { unlock, password } = this;

    if (unlock !== '' && password === '') {
      return true;
    }

    if (unlock === '' && password !== '') {
      return true;
    }

    return false;
  }
}
