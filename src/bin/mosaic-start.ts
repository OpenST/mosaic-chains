#!/usr/bin/env node

import * as commander from 'commander';
import { version } from '../../package.json';
import NodeFactory from '../Node/NodeFactory';
import Node from '../Node/Node';
import NodeOptions from './NodeOptions';

let mosaic = commander
  .version(version)
  .arguments('<chains...>');

mosaic = NodeOptions.addCliOptions(mosaic);

mosaic
  .option('-u,--unlock <accounts>', 'a comma separated list of accounts that get unlocked in the node; you must use this together with --password')
  .option('-s,--password <file>', 'the path to the password file on your machine; you must use this together with --unlock')
  .action((chainIds: string[], options) => {
    let {
      mosaicDir,
      port,
      rpcPort,
      websocketPort,
      keepAfterStop,
      unlock,
      password,
    } = NodeOptions.parseOptions(options);

    for (const chainId of chainIds) {
      const node: Node = NodeFactory.create({
        chainId,
        mosaicDir,
        port,
        rpcPort,
        websocketPort,
        keepAfterStop,
        unlock,
        password,
      });

      node.start();

      // Every additional chain will have all published docker ports increased by one.
      port += 1;
      rpcPort += 1;
      websocketPort += 1;
    }
  })
  .parse(process.argv);
