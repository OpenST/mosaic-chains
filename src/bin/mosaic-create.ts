#!/usr/bin/env node
import * as commander from 'commander';

import { version } from '../../package.json';
import Logger from '../Logger';
import Initialization from '../NewChain/Initialization';
import NodeOptions from './NodeOptions';
import NodeDescription from '../Node/NodeDescription';
import Directory from '../Directory';

let mosaic = commander
  .version(version)
  .arguments('<new-chain-id> <origin-websocket> <password-file>');
mosaic = NodeOptions.addCliOptions(mosaic);
mosaic.action(
  async (
    newChainId: string,
    originWebsocket: string,
    passwordFile: string,
    options,
  ) => {
    const nodeOptions: NodeOptions = NodeOptions.parseOptions(options, newChainId);
    let nodeDescription = new NodeDescription(newChainId);
    nodeDescription = Object.assign(nodeDescription, nodeOptions);
    nodeDescription.password = Directory.sanitize(passwordFile);

    try {
      await Initialization.initialize(
        newChainId,
        originWebsocket,
        nodeDescription,
      );
    } catch (error) {
      Logger.error('error while executing mosaic create', { error: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
