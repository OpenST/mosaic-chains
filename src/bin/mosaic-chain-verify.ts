#!/usr/bin/env node

import * as commander from 'commander';

import { version } from '../../package.json';
import Logger from '../Logger';
import ChainVerification from '../NewChain/ChainVerifier';
import NodeOptions from './NodeOptions';

let mosaic = commander
  .version(version)
  .arguments('<origin-websocket> <auxiliary-websocket> <mosaic-config-path>');
mosaic = NodeOptions.addCliOptions(mosaic);
mosaic.action(
  async (
    originWebsocket: string,
    auxiliaryWebsocket: string,
    mosaicConfigPath: string,
  ) => {
    try {
      const chainVerificationInstance = new ChainVerification(
        originWebsocket,
        auxiliaryWebsocket,
        mosaicConfigPath,
      );
    } catch (error) {
      Logger.error('error while executing mosaic chain verification', { error: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
