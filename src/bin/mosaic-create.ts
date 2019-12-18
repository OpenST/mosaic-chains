#!/usr/bin/env node
import * as commander from 'commander';

import Logger from '../Logger';
import Initialization from '../NewChain/Initialization';
import NodeOptions from './NodeOptions';
import NodeDescription from '../Node/NodeDescription';
import Directory from '../Directory';
import Validator from './Validator';
import { GETH_CLIENT } from '../Node/ChainInfo';

let mosaic = commander
  .arguments('<new-chain-id> <origin-websocket> <password-file>');
mosaic = NodeOptions.addCliOptions(mosaic);
mosaic.action(
  async (
    newChainId: string,
    originWebsocket: string,
    passwordFile: string,
    options,
  ) => {
    const isValidWeb3Connection = await Validator.isValidWeb3EndPoint(originWebsocket);
    if (!isValidWeb3Connection) {
      Logger.error('Could not connect to origin node with web3');
    }
    const nodeOptions: NodeOptions = NodeOptions.parseOptions(options, newChainId);
    if (nodeOptions.originChain === '') {
      Logger.error('Unknown origin, please provide --origin');
      process.exit(1);
    }
    let nodeDescription = new NodeDescription(newChainId);
    nodeDescription = Object.assign(nodeDescription, nodeOptions);
    nodeDescription.password = Directory.sanitize(passwordFile);
    nodeDescription.client = GETH_CLIENT;

    try {
      await Initialization.initialize(
        newChainId,
        originWebsocket,
        nodeDescription,
      );
    } catch (error) {
      Logger.error('error while executing mosaic create: ', { message: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
