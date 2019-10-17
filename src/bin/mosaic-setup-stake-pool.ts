#!/usr/bin/env node

import * as commander from 'commander';
import Logger from '../Logger';
import deployStakePool from '../lib/StakePool';
import Validator from './Validator';

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
    if (!Validator.isValidOriginChain(chain)) {
      console.error(`Invalid origin chain identifier: ${chain}`)
      process.exit(1);
    }

    if (!Validator.isValidAddress(deployer)) {
      console.error(`Invalid deployer address: ${deployer}`);
      process.exit(1);
    }
    if (!Validator.isValidAddress(organizationOwner)) {
      console.error(`Invalid organization owner address: ${organizationOwner}`);
      process.exit(1);
    }

    if (!Validator.isValidAddress(organizationAdmin)) {
      console.error(`Invalid organization admin address: ${organizationAdmin}`);
      process.exit(1);
    }
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
