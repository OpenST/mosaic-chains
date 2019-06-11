#!/usr/bin/env node

import * as commander from 'commander';
import NodeFactory from '../Node/NodeFactory';
import Node from '../Node/Node';
import NodeOptions from './NodeOptions';
import Graph from "../Graph/Graph";
import GraphOptions from './GraphOptions';

let mosaic = commander
  .arguments('<chain>');

mosaic = NodeOptions.addCliOptions(mosaic);
mosaic = GraphOptions.addCliOptions(mosaic);

mosaic
  .option('-u,--unlock <accounts>', 'a comma separated list of accounts that get unlocked in the node; you must use this together with --password')
  .option('-s,--password <file>', 'the path to the password file on your machine; you must use this together with --unlock')
  .option('-wgn,--withoutGraphNode', 'boolean value which would decide we need to start graph node')
  .action((chain: string, options) => {

    console.log('entring start command');

    const {
      mosaicDir,
      port,
      rpcPort,
      websocketPort,
      keepAfterStop,
      unlock,
      password,
    } = NodeOptions.parseOptions(options, chain);

    console.log('step: 1: ', chain, mosaicDir, port, rpcPort, websocketPort, keepAfterStop, unlock);

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

    console.log('step: 2: ', nodeRpcPort);

    node.start();

    console.log('step: 3');

    if (!options.withoutGraphNode) {

      console.log('step: 4');

      const {
        rpcPort,
        websocketPort,
        rpcAdminPort,
        ipfsPort,
        postgresPort,
        keepAfterStop,
      } = GraphOptions.parseOptions(options, chain);

      const graph = new Graph({
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

      graph.start();

    }

  })
  .parse(process.argv);
