#!/usr/bin/env node

import * as commander from 'commander';

import { version } from '../../package.json';
import Logger from '../Logger';
import OriginChain from "../NewChain/OriginChain";
import Web3 = require("web3");
import MosaicConfig from "../Config/MosaicConfigV2";

let mosaic = commander
  .version(version)
  .arguments('<chain> <origin-websocket> <deployer>');
mosaic.action(
  async (
    chain: string,
    originWebsocket: string,
    deployer: string,
  ) => {

      console.log('originWebsocket  ',originWebsocket);
    try {

      const originWeb3 = new Web3(originWebsocket);
      const {
        gatewayLib,
        messageBus,
        merklePatriciaProof,
      } = await OriginChain.deployLibraries(originWeb3, deployer);

      const mosaicConfig:MosaicConfig = new MosaicConfig();

      mosaicConfig.originChain.chain = chain;
      mosaicConfig.originChain.contractAddress.gatewayLibAddress = gatewayLib.address;
      mosaicConfig.originChain.contractAddress.messageBusAddress = messageBus.address;
      mosaicConfig.originChain.contractAddress.merklePatricialLibAddress = merklePatriciaProof.address;

      mosaicConfig.writeToMosaicConfigDirectory();
    } catch (error) {
      Logger.error('error while executing mosaic libraries', { error: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
