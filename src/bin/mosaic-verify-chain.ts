#!/usr/bin/env node

import * as commander from 'commander';

import { version } from '../../package.json';
import Logger from '../Logger';
import ChainVerifier from '../NewChain/ChainVerifier';
import NodeOptions from './NodeOptions';

let mosaic = commander
  .version(version)
  .arguments('<origin-websocket> <auxiliary-websocket> <chain-id>');
mosaic = NodeOptions.addCliOptions(mosaic);
mosaic.action(
  async (
    originWebsocket: string,
    auxiliaryWebsocket: string,
    chainId: string,
  ) => {
    try {
      const chainVerifier = new ChainVerifier(
        originWebsocket,
        auxiliaryWebsocket,
        chainId,
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
