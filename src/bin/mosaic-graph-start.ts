#!/usr/bin/env node

import * as mosaic from 'commander';
import * as fs from 'fs-extra';
import * as markdownTable from 'markdown-table';
import * as path from 'path';

import Integer from '../Integer';
import Logger from '../Logger';
import Shell from '../Shell';
import Utils from '../Utils';
import Directory from '../Directory';

import waitPort = require('wait-port');
import UrlParse = require('url-parse');

const DEFAULT_POSTGRES_PASSWORD = 'let-me-in';
const DEFAULT_POSTGRES_DATABASE = 'graph-node';

class GraphDescription {
  public containerName: string;

  public ethereumRpcEndpoint: string;

  public graphDatadir: string;

  public graphRpcPort: number;

  public graphWsPort: number;

  public graphRpcAdminPort: number;

  public graphIpfsPort: number;

  public graphPostgresPort: number;

  public graphPostgresUser: string;

  public graphPostgresPassword: string;

  public graphPostgresDatabase: string;
}

export default class Graph {
  private readonly containerName: string;

  private readonly network: string;

  private readonly ethereumRpcEndpoint: string;

  private readonly graphDatadir: string;

  private readonly graphRpcPort: number;

  private readonly graphWsPort: number;

  private readonly graphRpcAdminPort: number;

  private readonly graphIpfsPort: number;

  private readonly graphPostgresPort: number;

  public graphPostgresUser: string;

  public graphPostgresPassword: string;

  public graphPostgresDatabase: string;

  public constructor(graphDescription: GraphDescription) {
    this.containerName = graphDescription.containerName;
    this.network = `graph-network-${this.containerName}`;

    this.ethereumRpcEndpoint = graphDescription.ethereumRpcEndpoint;

    this.graphDatadir = graphDescription.graphDatadir;
    this.graphRpcPort = graphDescription.graphRpcPort;
    this.graphWsPort = graphDescription.graphWsPort;
    this.graphRpcAdminPort = graphDescription.graphRpcAdminPort;
    this.graphIpfsPort = graphDescription.graphIpfsPort;
    this.graphPostgresUser = graphDescription.graphPostgresUser;
    this.graphPostgresPassword = graphDescription.graphPostgresPassword;
    this.graphPostgresDatabase = graphDescription.graphPostgresDatabase;
    this.graphPostgresPort = graphDescription.graphPostgresPort;
  }

  /**
   * Starts the docker container that runs this graph.
   */
  public start(): Promise<void> {
    Logger.info('attempting to start graph container');
    this.ensureNetworkExists();
    const commandParts = this.defaultDockerGraphCommand;
    commandParts.push('up');
    commandParts.push('--detach');
    const command = commandParts.join(' ');
    Logger.info(`"start graph container command: ${command}"`);
    Shell.executeInShell(command);
    return this.waitForNodeToBeAccessible();
  }

  /**
   * Stops the docker container that runs this graph.
   */
  public stop(): void {
    Logger.info('attempting to stop graph container');
    const commandParts = this.defaultDockerGraphCommand;
    commandParts.push('down');
    Shell.executeInShell(commandParts.join(' '));
  }

  /** Create a docker network if network doesn't exists. */
  private ensureNetworkExists(): void {
    // `-w` in grep is used to match the exact string.
    //  Command for creating network only if network doesn't exists.
    const createNetwork = `docker network ls | grep -w ${this.network} || `
      + `docker network create ${this.network}`;
    Shell.executeInShell(createNetwork);
  }

  private get defaultDockerGraphCommand(): string[] {
    const url = new UrlParse(this.ethereumRpcEndpoint);

    return [
      `MOSAIC_GRAPH_RPC_PORT=${this.graphRpcPort}`,
      `MOSAIC_GRAPH_WS_PORT=${this.graphWsPort}`,
      `MOSAIC_GRAPH_RPC_ADMIN_PORT=${this.graphRpcAdminPort}`,
      `MOSAIC_GRAPH_IPFS_PORT=${this.graphIpfsPort}`,
      `MOSAIC_POSTGRES_USER=${this.graphPostgresUser}`,
      `MOSAIC_POSTGRES_PASSWORD=${this.graphPostgresPassword}`,
      `MOSAIC_POSTGRES_DATABASE=${this.graphPostgresDatabase}`,
      `MOSAIC_POSTGRES_PORT=${this.graphPostgresPort}`,
      `MOSAIC_GRAPH_DATA_FOLDER=${this.graphDatadir}`,
      `MOSAIC_ETHEREUM_RPC_PORT=${url.port}`,
      `MOSAIC_GRAPH_NODE_HOST=${url.protocol}:${url.hostname}`,
      'docker-compose',
      `-f ${path.join(Directory.getProjectGraphDir(), 'docker-compose.yml')}`,
      '-p', this.containerName,
    ];
  }

  /**
   * Returns a promise which resolves when node becomes accessible.
   * @return {Promise<>}
   */
  private waitForNodeToBeAccessible(): Promise<any> {
    const waitForWebsocketPort = waitPort({ port: this.graphWsPort, output: 'silent' });
    const waitForRpcAdminPort = waitPort({ port: this.graphRpcAdminPort, output: 'silent' });
    const waitForRpcPort = waitPort({ port: this.graphRpcPort, output: 'silent' });
    const waitForPostgresPort = waitPort({ port: this.graphPostgresPort, output: 'silent' });
    const waitForIpfsPort = waitPort({ port: this.graphIpfsPort, output: 'silent' });
    // wait for all graph related ports to be available for use
    return Promise.all([
      waitForWebsocketPort,
      waitForRpcAdminPort,
      waitForRpcPort,
      waitForPostgresPort,
      waitForIpfsPort,
    ]).then(() => new Promise((resolve) => {
      // even after the ports are available the nodes need a bit of time to get online
      setTimeout(resolve, 10000);
    }));
  }
}

function parseOptions(options): GraphDescription {
  const { containerName } = options;
  if (!containerName) {
    throw new Error('Container name is empty.');
  }

  const { ethereumRpcEndpoint } = options;
  if (!ethereumRpcEndpoint) {
    throw new Error('Ethereum rpc endpoint is empty.');
  }

  const { graphDatadir } = options;
  if (!fs.existsSync(graphDatadir)) {
    throw new Error('Specified graph datadir does not exist.');
  }

  const { graphRpcPort } = options;
  const { graphWsPort } = options;
  const { graphRpcAdminPort } = options;
  const { graphIpfsPort } = options;
  const { graphPostgresPort } = options;
  const { graphPostgresUser } = options;

  const graphPostgresPassword = DEFAULT_POSTGRES_PASSWORD;

  const graphPostgresDatabase = DEFAULT_POSTGRES_DATABASE;

  return {
    containerName,
    ethereumRpcEndpoint,
    graphDatadir,
    graphRpcPort,
    graphWsPort,
    graphRpcAdminPort,
    graphIpfsPort,
    graphPostgresPort,
    graphPostgresUser,
    graphPostgresPassword,
    graphPostgresDatabase,
  };
}

mosaic
  .requiredOption(
    '-c,--container-name <container>',
    'container name of docker',
  )
  .requiredOption(
    '-e,--ethereum-rpc-endpoint <endpoint>',
    'ethereum rpc endpoint to index graph data',
  )
  .requiredOption(
    '-D,--graph-datadir <dir>',
    'path to graph data directory',
  )
  .requiredOption(
    '-R,--graph-rpc-port <port>',
    'RPC port of graph node',
    Integer.parseString,
  )
  .requiredOption(
    '-W,--graph-ws-port <port>',
    'websocket port of graph node',
    Integer.parseString,
  )
  .requiredOption(
    '-A,--graph-rpc-admin-port <port>',
    'RPC admin port of graph node',
    Integer.parseString,
  )
  .requiredOption(
    '-I,--graph-ipfs-port <port>',
    'ipfs port of ipfs node containing indexed graph data',
    Integer.parseString,
  )
  .requiredOption(
    '-U,--graph-postgres-user <user>',
    'user of postgres database of graph node',
  )
  .option(
    '-P,--graph-postgres-password-file <password>',
    'path of a file containing password of postgres database of graph node',
  )
  .requiredOption(
    '-S,--graph-postgres-port <port>',
    'port of postgres database of graph node',
    Integer.parseString,
  )

  .action(async (options) => {
    try {
      const optionInput = Object.assign({}, options);

      const graphDescription: GraphDescription = parseOptions(
        optionInput,
      );

      await (new Graph(graphDescription).start());

      const ipAddress = Utils.ipAddress();

      // Printing of endpoints on console.
      const graphNodeEndPoints = markdownTable([
        ['Type', 'URL'],
        ['ethereum-endpoint', `http://${graphDescription.ethereumRpcEndpoint}`],
        ['graph-rpc', `http://${ipAddress}:${graphDescription.graphRpcPort}`],
        ['graph-ws', `ws://${ipAddress}:${graphDescription.graphWsPort}`],
        ['graph-admin', `http://${ipAddress}:${graphDescription.graphRpcAdminPort}`],
      ], {
        align: ['c', 'c', 'c', 'c'],
      });

      const postGresEndPoints = markdownTable([
        ['Type', 'URL'],
        ['postgres-rpc', `http://${ipAddress}:${graphDescription.graphPostgresPort}`],
      ], {
        align: ['c', 'c'],
      });

      const ipfsEndPoints = markdownTable([
        ['Type', 'URL'],
        ['ipfs-rpc', `http://${ipAddress}:${graphDescription.graphIpfsPort}`],
      ], {
        align: ['c', 'c'],
      });
      Logger.info(
        `\n Below are the list of endpoints for graph node : \n${graphNodeEndPoints}\n`,
      );
      Logger.info(
        `\n Below are the list of endpoints for postgres db : \n${postGresEndPoints}\n`,
      );
      Logger.info(
        `\n Below are the list of endpoints for ipfs : \n${ipfsEndPoints}\n`,
      );
    } catch (e) {
      Logger.error(`Error starting node: ${e} `);
    }
  })
  .parse(process.argv);
