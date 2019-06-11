#!/usr/bin/env node

import * as commander from 'commander';
import { version } from '../../package.json';
import NodeFactory from '../Node/NodeFactory';
import Node from '../Node/Node';
import NodeOptions from './NodeOptions';
import Graph from "../Graph/Graph";
import GraphOptions from './GraphOptions';

let mosaic = commander
  .version(version)
  .arguments('<chain>');

mosaic = NodeOptions.addCliOptions(mosaic);
mosaic = GraphOptions.addCliOptions(mosaic);

mosaic
  .option('-u,--unlock <accounts>', 'a comma separated list of accounts that get unlocked in the node; you must use this together with --password')
  .option('-s,--password <file>', 'the path to the password file on your machine; you must use this together with --unlock')
  .option('-wgn,--withoutGraphNode', 'boolean value which would decide we need to start graph node')
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

    const nodeRpcPort = rpcPort;

    node.start();

    if (!options.withoutGraphNode) {
      const {
        rpcPort,
        websocketPort,
        rpcAdminPort,
        ipfsPort,
        postgresPort,
        keepAfterStop,
      } = GraphOptions.parseOptions(options, chain);

      const graphNode = new Graph({
        chain,
        mosaicDir,
        nodeRpcPort,
        rpcPort,
        websocketPort,
        rpcAdminPort,
        ipfsPort,
        postgresPort,
        keepAfterStop,
      });

      graphNode.start();

    }

  })
  .parse(process.argv);
