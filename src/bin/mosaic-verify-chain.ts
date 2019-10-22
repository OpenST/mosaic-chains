#!/usr/bin/env node

import * as commander from 'commander';

import Logger from '../Logger';
import ChainVerifier from '../NewChain/ChainVerifier';
import NodeOptions from './NodeOptions';
import Validator from './Validator';

import Web3 = require('web3');

let mosaic = commander
  .arguments('<origin-websocket> <auxiliary-websocket> <origin-chain-identifier> <auxiliary-chain-identifier>');
mosaic = NodeOptions.addCliOptions(mosaic);
mosaic.action(
  async (
    originWebsocket: string,
    auxiliaryWebsocket: string,
    originChainIdentifier: string,
    auxiliaryChainIdentifier: string,
  ) => {
    const originWeb3 = new Web3(originWebsocket);
    const isOriginListening = await originWeb3.eth.net.isListening();
    if (!isOriginListening) {
      Logger.error('Could not connect to origin node with web3');
    }

    const auxWeb3 = new Web3(auxiliaryWebsocket);
    const isAuxListening = await auxWeb3.eth.net.isListening();
    if (!isAuxListening) {
      Logger.error('Could not connect to auxiliary node with web3');
    }

    if (!Validator.isValidOriginChain(originChainIdentifier)) {
      Logger.error(`Invalid origin chain identifier: ${originChainIdentifier}`);
      process.exit(1);
    }

    if (!Validator.isValidAuxChain(auxiliaryChainIdentifier, originChainIdentifier)) {
      Logger.error(`Invalid aux chain identifier: ${auxiliaryChainIdentifier}`);
      process.exit(1);
    }
    try {
      const chainVerifier = new ChainVerifier(
        originWebsocket,
        auxiliaryWebsocket,
        originChainIdentifier,
        auxiliaryChainIdentifier,
      );
      await chainVerifier.verify();
    } catch (error) {
      Logger.error('error while executing mosaic chain verification', { error: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
