#!/usr/bin/env node

import * as commander from 'commander';
import Logger from '../Logger';
import deployStakePool from '../lib/StakePool';
import Validator from './Validator';
import Utils from '../Utils';

const mosaic = commander
  .arguments('<chain> <origin-websocket> <deployer> <organizationOwner> <organizationAdmin>');
mosaic.option('-m,--mosaic-config <string>', 'Mosaic config absolute path.');
mosaic.action(
  async (
    chain: string,
    originWebsocket: string,
    deployer: string,
    organizationOwner: string,
    organizationAdmin: string,
    options,
  ) => {
    const isValidWeb3Connection = await Validator.isValidWeb3EndPoint(originWebsocket);
    if (!isValidWeb3Connection) {
      Logger.error('Could not connect to origin node with web3');
    }
    if (!Validator.isValidOriginChain(chain)) {
      Logger.error(`Invalid origin chain identifier: ${chain}`);
      process.exit(1);
    }

    if (!Validator.isValidAddress(deployer)) {
      Logger.error(`Invalid deployer address: ${deployer}`);
      process.exit(1);
    }
    if (!Validator.isValidAddress(organizationOwner)) {
      Logger.error(`Invalid organization owner address: ${organizationOwner}`);
      process.exit(1);
    }

    if (!Validator.isValidAddress(organizationAdmin)) {
      Logger.error(`Invalid organization admin address: ${organizationAdmin}`);
      process.exit(1);
    }
    try {
      const stakePoolAddress = await deployStakePool(
        chain,
        originWebsocket,
        deployer,
        organizationOwner,
        organizationAdmin,
        options.mosaicConfig,
      );
      Utils.printContracts(['Stake pool'], [stakePoolAddress]);
    } catch (error) {
      Logger.error('error while executing mosaic setup stake pool', { error: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
