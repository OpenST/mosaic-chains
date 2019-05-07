#!/usr/bin/env node

import * as commander from 'commander';
import { version } from '../../package.json';
import NodeFactory from '../Node/NodeFactory';
import Node from '../Node/Node';
import NodeOptions from './NodeOptions';
import Logger from "../Logger";

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

    if (chainIds.length > 1) {
      if (port !== undefined) {
        Logger.error('cannot use --port with multiple chain ids');
        process.exit(1);
      }
      if (rpcPort !== undefined) {
        Logger.error('cannot use --rpcPort with multiple chain ids');
        process.exit(1);
      }
      if (websocketPort !== undefined) {
        Logger.error('cannot use --websocketPort with multiple chain ids');
        process.exit(1);
      }
    }

    for (const chainId of chainIds) {
      const chainIdNumber = NodeFactory.getChainId(chainId);
      if (port === undefined) {
        port = NodeOptions.getPortForChainId(chainIdNumber);
      }
      if (rpcPort === undefined) {
        rpcPort = NodeOptions.getRpcPortForChainId(chainIdNumber);
      }
      if (websocketPort === undefined) {
        websocketPort = NodeOptions.getWsPortForChainId(chainIdNumber);
      }

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

      port = undefined;
      rpcPort = undefined;
      websocketPort = undefined;
    }
  })
  .parse(process.argv);
