#!/usr/bin/env node

import * as commander from 'commander';

import Logger from '../Logger';
import ChainVerifier from '../NewChain/ChainVerifier';
import NodeOptions from './NodeOptions';

let mosaic = commander
  .arguments('<origin-websocket> <auxiliary-websocket> <origin-chain-identifier> <auxiliary-chain-identifier>');
mosaic = NodeOptions.addCliOptions(mosaic);
mosaic.action(
  async (
    originWebsocket: string,
    auxiliaryWebsocket: string,
    originChainIdentifier: string,
    auxiliaryChainIdentifier: string
  ) => {
    try {
      const chainVerifier = new ChainVerifier(
        originWebsocket,
        auxiliaryWebsocket,
        originChainIdentifier,
        auxiliaryChainIdentifier,
      );
      await chainVerifier.verify();
    } catch (error) {
      Logger.error('error while executing mosaic chain verification', { error: error.toString()});
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
