import Logger from '../Logger';
import Directory from '../Directory';

// These defaults will be used if the relevant option is not given on the command line.
const DEFAULT_DATA_DIR = '~/.mosaic'
const DEFAULT_PORT = 30303;
const DEFAULT_RPC_PORT = 8545;
const DEFAULT_WS_PORT = 8645;

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
   * @param options The options from the command line.
   */
  constructor(options: {
    mosaicDir: string,
    port: string,
    rpcPort: string,
    websocketPort: string,
    keepAfterStop: boolean,
    unlock: string,
    password: string,
  }) {
    Object.assign(this, options);
  }

  /**
   * Adds the common node options to a command. Does not include unlock and password. Add these
   * separately if you need them.
   * @param command The command where to add the options.
   * @returns The command with the options added.
   */
  public static addCliOptions(command): any {
    command
      .option('-d,--mosaic-dir <dir>', 'a path to a directory where the chain data will be stored', DEFAULT_DATA_DIR)
      .option('-p,--port <port>', 'the first port to use for forwarding from host to container', NodeOptions.stringToDecimal, DEFAULT_PORT)
      .option('-r,--rpc-port <port>', 'the first RPC port to use for forwarding from host to container', NodeOptions.stringToDecimal, DEFAULT_RPC_PORT)
      .option('-w,--ws-port <port>', 'the first WS port to use for forwarding from host to container', NodeOptions.stringToDecimal, DEFAULT_WS_PORT)
      .option('-k,--keep', 'if set, the container will not automatically be deleted when stopped');

    return command;
  }

  /**
  * Parses the commander options and returns an Options object.
  * @param options Options as they are given by commander.
  * @returns The parsed options with defaults for options that are missing from the command line.
  */
  public static parseOptions(options): NodeOptions {
    const parsedOptions: NodeOptions = new NodeOptions({
      mosaicDir: options.mosaicDir || DEFAULT_DATA_DIR,
      port: options.port || DEFAULT_PORT,
      rpcPort: options.rpcPort || DEFAULT_RPC_PORT,
      websocketPort: options.wsPort || DEFAULT_WS_PORT,
      keepAfterStop: options.keep ? true : false,
      unlock: options.unlock || '',
      password: options.password || '',
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

    if (unlock === undefined && password === undefined) {
      return false;
    }

    if (unlock !== '' && password === '') {
      return true;
    }

    if (unlock === '' && password !== '') {
      return true;
    }

    return false;
  }

  /**
   * Converts a given string to a decimal number.
   * @param string The string to convert.
   * @returns The parsed decimal.
   */
  public static stringToDecimal(string: string): number {
    return parseInt(string, 10);
  }
}