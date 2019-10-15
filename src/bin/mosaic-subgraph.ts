#!/usr/bin/env node

import * as commander from 'commander';

import Logger from '../Logger';
import MosaicConfig from '../Config/MosaicConfig';
import SubGraph, { SubGraphType } from '../Graph/SubGraph';
import GatewayAddresses from '../Config/GatewayAddresses';

const mosaic = commander
  .arguments('<originChain> <auxiliaryChain> <subgraphType> <graphAdminRPC> <graphIPFS>');

mosaic.option('-m,--mosaic-config <string>', 'Mosaic config absolute path');
mosaic.option('-t,--gateway-config <string>', 'Gateway config absolute path');
mosaic.option('-a,--auxiliary <string>', 'auxiliary chain identifier');
mosaic.action(
  async (
    originChain: string,
    auxiliaryChain: string,
    subgraphType: SubGraphType,
    graphAdminRPC: string,
    graphIPFS: string,
    options,
  ) => {
    try {
      let gatewayAddresses;

      if (options.mosaicConfig) {
        const mosaicConfig = MosaicConfig.fromFile(options.mosaicConfig);
        gatewayAddresses = GatewayAddresses.fromMosaicConfig(mosaicConfig, auxiliaryChain);
      } else if (MosaicConfig.exists(originChain)) {
        const mosaicConfig = MosaicConfig.fromChain(originChain);
        gatewayAddresses = GatewayAddresses.fromMosaicConfig(mosaicConfig, auxiliaryChain);
      }

      if (!gatewayAddresses) {
        console.error('Mosaic config or token config not found . Use --mosaic-config or --token-config option to provide path.');
        process.exit(1);
      }

      new SubGraph(
        originChain,
        auxiliaryChain,
        subgraphType,
        graphAdminRPC,
        graphIPFS,
        gatewayAddresses,
      ).deploy();
    } catch (error) {
      Logger.error('error while executing mosaic libraries', { error: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
