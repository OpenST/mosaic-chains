import Integer from '../Integer';
import ChainInfo from '../Node/ChainInfo';
import GraphDescription from '../Graph/GraphDescription';
import * as fs from 'fs-extra';
import Logger from '../Logger';

// These defaults will be used if the relevant option is not given on the command line.
const DEFAULT_RPC_PORT = 10000;
const DEFAULT_WS_PORT = 60000;
const DEFAULT_RPC_ADMIN_PORT = 8020;
const DEFAULT_IPFS_PORT = 5001;
const DEFAULT_POSTGRES_PORT = 5432;
const DEFAULT_POSTGRES_USER = 'graph-node';
const DEFAULT_POSTGRES_PASSWORD = 'let-me-in';
const DEFAULT_POSTGRES_DATABASE = 'graph-node';

/**
 * Command line options for running an graph node.
 */
export default class GraphOptions {
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
   * Adds the common node options to a command.
   * @param command The command where to add the options.
   * @returns The command with the options added.
   */
  public static addCliOptions(command): any {
    command
      .option('-R,--graph-rpc-port <port>', 'the RPC port to use for forwarding from host to container', Integer.parseString)
      .option('-W,--graph-ws-port <port>', 'the WS port to use for forwarding from host to container', Integer.parseString)
      .option('-A,--graph-rpc-admin-port <port>', 'the RPC port to use for forwarding Admin requests from host to container', Integer.parseString)
      .option('-I,--graph-ipfs-port <port>', 'the port to use for forwarding IPFS calls from host to container', Integer.parseString)
      .option('-U,--graph-postgres-user <user>', 'the user to use for Postgres')
      .option('-P,--graph-postgres-password-file <password>', 'path to the file containing password to use for Postgres')
      .option('-S,--graph-postgres-port <port>', 'the port to use for forwarding Postgres from host to container', Integer.parseString);

    return command;
  }

  /**
   * Parses the commander options and returns an Options object.
   * @param options Options as they are given by commander.
   * @param chain Chain identifier.
   * @returns The parsed options with defaults for options that are missing from the command line.
   */
  public static parseOptions(options, chain): GraphDescription {
    const chainIdNumber = ChainInfo.getChainId(chain);
    const graphDescription: GraphDescription = new GraphDescription(chain);
    graphDescription.rpcPort = options.graphRpcPort || Integer.parseString(chainIdNumber) + DEFAULT_RPC_PORT;
    graphDescription.websocketPort = options.graphWsPort || Integer.parseString(chainIdNumber) + DEFAULT_WS_PORT;
    graphDescription.rpcAdminPort = options.graphRpcAdminPort || Integer.parseString(chainIdNumber) + DEFAULT_RPC_ADMIN_PORT;
    graphDescription.ipfsPort = options.graphIpfsPort || Integer.parseString(chainIdNumber) + DEFAULT_IPFS_PORT;
    graphDescription.postgresPort = options.graphPostgresPort || Integer.parseString(chainIdNumber) + DEFAULT_POSTGRES_PORT;
    graphDescription.postgresUser = options.graphPostgresUser || DEFAULT_POSTGRES_USER;
    if (options.graphPostgresPasswordFile) {
      if (!fs.pathExistsSync(options.graphPostgresPasswordFile)) {
        const message = `Postgres password file ${options.graphPostgresPasswordFile} does not exist`;
        Logger.error(message);
        throw new Error(message);
      }
      graphDescription.postgresPassword = `${fs.readFileSync(
        options.graphPostgresPasswordFile,
        {
          encoding: 'utf8',
        },
      ).trim()}`;
    } else {
      graphDescription.postgresPassword = DEFAULT_POSTGRES_PASSWORD;
    }
    graphDescription.postgresDatabase = DEFAULT_POSTGRES_DATABASE;
    graphDescription.keepAfterStop = !!options.keep;
    graphDescription.originChain = options.origin;
    return graphDescription;
  }
}
