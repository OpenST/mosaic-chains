#!/usr/bin/env node

import * as commander from 'commander';
import NodeFactory from '../Node/NodeFactory';
import Node from '../Node/Node';
import NodeOptions from './NodeOptions';
import Graph from '../Graph/Graph';
import GraphOptions from './GraphOptions';
import GraphDescription from "../Graph/GraphDescription";
import MosaicConfig from "../Config/MosaicConfig";
import MosaicConfigFactory from "../Config/MosaicConfigFactory";
import DeploySubGraph from "../Graph/DeploySubGraph";
import Logger from '../Logger';

const waitPort = require('wait-port');

let mosaic = commander
  .arguments('<chain>');

mosaic = NodeOptions.addCliOptions(mosaic);
mosaic = GraphOptions.addCliOptions(mosaic);

mosaic
  .option('-o,--origin <string>', 'identifier for origin chain. To be passed while starting auxiliary chain')
  .option('-u,--unlock <accounts>', 'a comma separated list of accounts that get unlocked in the node; you must use this together with --password')
  .option('-s,--password <file>', 'the path to the password file on your machine; you must use this together with --unlock')
  .option('-wgn,--withoutGraphNode', 'boolean flag which decides if graph node should be started')
  .action((chain: string, options) => {
    const {
      mosaicDir,
      port,
      rpcPort,
      websocketPort,
      keepAfterStop,
      unlock,
      password,
    } = NodeOptions.parseOptions(options, chain);
    const node: Node = NodeFactory.create({
      chain,
      mosaicDir,
      port,
      rpcPort,
      websocketPort,
      keepAfterStop,
      unlock,
      password,
    });
    node.start();

    if (!options.withoutGraphNode) {
      const deploySubGraphs = function (graphDescription) {
        const waitForWebsocketPort = waitPort({ port: graphDescription.websocketPort, output: 'silent' });
        const waitForRpcAdminPort = waitPort({ port: graphDescription.rpcAdminPort, output: 'silent' });
        const waitForRpcPort = waitPort({ port: graphDescription.rpcPort, output: 'silent' });
        const waitForPostgresPort = waitPort({ port: graphDescription.postgresPort, output: 'silent' });
        const waitForIpfsPort = waitPort({ port: graphDescription.ipfsPort, output: 'silent' });
        return Promise.all([waitForWebsocketPort, waitForRpcAdminPort, waitForRpcPort,
          waitForPostgresPort, waitForIpfsPort])
          .then(function () {
            // even after the ports are available the nodes need a bit of time to get online
            return new Promise(resolve => setTimeout(resolve, 5000));
          })
          .then(function () {
            const mosaicConfig: MosaicConfig = MosaicConfigFactory.from(chain);
            if (mosaicConfig.auxiliaryChains.hasOwnProperty(chain)) {
              const subGraphType = DeploySubGraph.auxiliarySubGraphType;
              Logger.info(`Starting Sub Graph Deployment for originChain: ${options.origin} auxiliaryChain: ${chain} subGraphType: ${subGraphType}`);
              const deploySubGraph = new DeploySubGraph(
                options.origin,
                chain,
                subGraphType,
                graphDescription.mosaicDir,
                graphDescription.rpcAdminPort,
                graphDescription.ipfsPort
              );
              deploySubGraph.start();
            } else {
              // while starting origin chain, deploy sub graphs with SubGraphType=origin for all auxiliary chains
              const subGraphType = DeploySubGraph.originSubGraphType;
              for (const auxiliaryChain of Object.keys(mosaicConfig.auxiliaryChains)) {
                Logger.info(`Starting Sub Graph Deployment for originChain: ${chain} auxiliaryChain: ${auxiliaryChain} subGraphType: ${subGraphType}`);
                const deploySubGraph = new DeploySubGraph(
                  chain,
                  auxiliaryChain,
                  subGraphType,
                  graphDescription.mosaicDir,
                  graphDescription.rpcAdminPort,
                  graphDescription.ipfsPort
                );
                deploySubGraph.start();
              }
            }
          });
      };

      const graphDescription: GraphDescription = GraphOptions.parseOptions(options, chain);
      // reuse params from node start command
      graphDescription.mosaicDir = mosaicDir;
      graphDescription.ethereumRpcPort = rpcPort;
      const graph = new Graph(graphDescription);
      graph.start();

      deploySubGraphs(graphDescription);

    }

  })
  .parse(process.argv);
