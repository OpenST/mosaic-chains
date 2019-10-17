#!/usr/bin/env node

import * as commander from 'commander';
import Logger from '../Logger';
import deployStakePool from '../lib/StakePool';

const mosaic = commander
  .arguments('<chain> <origin-websocket> <deployer> <organizationOwner> <organizationAdmin>');
mosaic.action(
  async (
    chain: string,
    originWebsocket: string,
    deployer: string,
    organizationOwner: string,
    organizationAdmin: string,
  ) => {
    try {
      await deployStakePool(chain, originWebsocket, deployer, organizationOwner, organizationAdmin);
    } catch (error) {
      Logger.error('error while executing mosaic setup stake pool', { error: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
