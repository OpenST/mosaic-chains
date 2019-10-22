#!/usr/bin/env node
import * as commander from 'commander';

import Logger from '../Logger';
import Initialization from '../NewChain/Initialization';
import NodeOptions from './NodeOptions';
import NodeDescription from '../Node/NodeDescription';
import Directory from '../Directory';
import Web3 = require("web3");

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

    const originWeb3 = new Web3(originWebsocket);
    // https://web3js.readthedocs.io/en/v1.2.0/web3-net.html#islistening
    const isListening = await originWeb3.eth.net.isListening();
    if (!isListening) {
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
