#!/usr/bin/env node

import * as commander from 'commander';

import Logger from '../Logger';
import ChainVerifier from '../NewChain/ChainVerifier';
import NodeOptions from './NodeOptions';

let mosaic = commander
  .arguments('<origin-websocket> <auxiliary-websocket> <origin-chain> <auxiliary-chain-id>');
mosaic = NodeOptions.addCliOptions(mosaic);
mosaic.action(
  async (
    originWebsocket: string,
    auxiliaryWebsocket: string,
    originChain: string,
    auxiliaryChainId: string
  ) => {
    try {
      const chainVerifier = new ChainVerifier(
        originWebsocket,
        auxiliaryWebsocket,
        originChain,
        auxiliaryChainId,
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