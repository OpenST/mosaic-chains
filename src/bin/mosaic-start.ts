#!/usr/bin/env node

import * as commander from 'commander';
import * as fs from 'fs-extra';
import NodeFactory from '../Node/NodeFactory';
import Node from '../Node/Node';
import NodeOptions from './NodeOptions';
import Graph from '../Graph/Graph';
import GraphOptions from './GraphOptions';
import GraphDescription from "../Graph/GraphDescription";
import Directory from "../Directory";

let mosaic = commander
  .arguments('<chain>');

mosaic = NodeOptions.addCliOptions(mosaic);
mosaic = GraphOptions.addCliOptions(mosaic);

mosaic
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
      const graphDescription: GraphDescription = GraphOptions.parseOptions(options, chain);
      // reuse params from node start command
      graphDescription.mosaicDir = mosaicDir;
      graphDescription.ethereumRpcPort = rpcPort;
      const graph = new Graph(graphDescription);
      graph.start();
    }

    // copy over the mosaic config files for existing chains
    fs.copySync(Directory.getProjectMosaicConfigDir(), Directory.getDefaultMosaicDataDir());

  })
  .parse(process.argv);
