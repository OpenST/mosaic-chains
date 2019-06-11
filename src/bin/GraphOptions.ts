import Integer from '../Integer';
import ChainInfo from '../Node/ChainInfo';

// These defaults will be used if the relevant option is not given on the command line.
const DEFAULT_RPC_PORT = 8000;
const DEFAULT_WS_PORT = 8101;
const DEFAULT_RPC_ADMIN_PORT = 8020;
const DEFAULT_IPFS_PORT = 5001;
const DEFAULT_POSTGRES_PORT = 5432;

/**
 * Command line options for running an graph node.
 */
export default class GraphOptions {

  /** The rpc port of the graph node that docker publishes on the host. */
  public rpcPort: number;

  /** The websocket port of the graph node that docker publishes on the host. */
  public websocketPort: number;

  /** The port of the graph node that docker publishes on the host. */
  public rpcAdminPort: number;

  /** The port of the graph's IPFS node that docker publishes on the host. */
  public ipfsPort: number;

  /** The port of the graph's Postgres node that docker publishes on the host. */
  public postgresPort: number;

  /** If set to true, the container will not be deleted when it is stopped. Defaults to false. */
  public keepAfterStop: boolean;

  /**
   * @param options The options from the command line.
   */
  constructor(options: {
    rpcPort: string;
    websocketPort: string;
    rpcAdminPort: string;
    ipfsPort: string;
    postgresPort: string;
    keepAfterStop: boolean;
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
      .option('-gr,--graph-rpc-port <port>', 'the RPC port to use for forwarding from host to container', Integer.parseString)
      .option('-gw,--graph-ws-port <port>', 'the WS port to use for forwarding from host to container', Integer.parseString)
      .option('-gra,--graph-rpc-admin-port <port>', 'the RPC port to use for forwarding Admin requests from host to container', Integer.parseString)
      .option('-gi,--graph-ipfs-port <port>', 'the port to use for forwarding IPFS calls from host to container', Integer.parseString)
      .option('-gp,--graph-postgres-port <port>', 'the port to use for forwarding Postgres from host to container', Integer.parseString)

    return command;
  }

  /**
   * Parses the commander options and returns an Options object.
   * @param options Options as they are given by commander.
   * @param chain Chain identifier.
   * @returns The parsed options with defaults for options that are missing from the command line.
   */
  public static parseOptions(options, chain): GraphOptions {
    const chainIdNumber = ChainInfo.getChainId(chain);
    const parsedOptions: GraphOptions = new GraphOptions({
      rpcPort: options.graphRpcPort || Number.parseInt(chainIdNumber) + DEFAULT_RPC_PORT,
      websocketPort: options.graphWsPort || Number.parseInt(chainIdNumber) + DEFAULT_WS_PORT,
      rpcAdminPort: options.graphRpcAdminPort || Number.parseInt(chainIdNumber) + DEFAULT_RPC_ADMIN_PORT,
      ipfsPort: options.graphIpfsPort || Number.parseInt(chainIdNumber) + DEFAULT_IPFS_PORT,
      postgresPort: options.graphPostgresPort || Number.parseInt(chainIdNumber) + DEFAULT_POSTGRES_PORT,
      keepAfterStop: !!options.keep,
    });
    return parsedOptions;
  }

}
