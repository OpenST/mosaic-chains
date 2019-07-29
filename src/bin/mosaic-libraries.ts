#!/usr/bin/env node

import * as commander from 'commander';

import Logger from '../Logger';
import OriginChainInteract from '../NewChain/OriginChainInteract';
import MosaicConfig from '../Config/MosaicConfig';
import PublishMosaicConfig from '../Config/PublishMosaicConfig';
import Utils from '../Utils';

import Web3 = require('web3');

const mosaic = commander
  .arguments('<chain> <origin-websocket> <deployer>');
mosaic.action(
  async (
    chain: string,
    originWebsocket: string,
    deployer: string,
  ) => {
    try {
      // Publishes mosaic configs for existing chains
      PublishMosaicConfig.tryPublish(chain);

      const originWeb3 = new Web3(originWebsocket);
      const {
        gatewayLib,
        messageBus,
        merklePatriciaProof,
      } = await OriginChainInteract.deployLibraries(originWeb3, deployer);

      const mosaicConfig: MosaicConfig = MosaicConfig.fromChain(chain);

      mosaicConfig.originChain.chain = chain;
      mosaicConfig.originChain.contractAddresses.gatewayLibAddress = Utils.toChecksumAddress(
        gatewayLib.address,
      );
      mosaicConfig.originChain.contractAddresses.messageBusAddress = Utils.toChecksumAddress(
        messageBus.address,
      );
      mosaicConfig.originChain.contractAddresses.merklePatriciaLibAddress = Utils.toChecksumAddress(
        merklePatriciaProof.address,
      );

      mosaicConfig.writeToMosaicConfigDirectory();
    } catch (error) {
      Logger.error('error while executing mosaic libraries', { error: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
