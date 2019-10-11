#!/usr/bin/env node

import * as commander from 'commander';

import Logger from '../Logger';
import MosaicConfig from '../Config/MosaicConfig';
import SubGraph, { SubGraphType } from '../Graph/SubGraph';
import TokenAddresses from '../Config/TokenAddresses';

const mosaic = commander
  .arguments('<originChain> <auxiliaryChain> <subgraphType> <graphAdminRPC> <graphIPFS>');

mosaic.option('-m,--mosaic-config <string>', 'Mosaic config absolute path');
mosaic.option('-t,--token-config <string>', 'Token config absolute path');
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
      let tokenAddresses;

      if (options.mosaicConfig) {
        const mosaicConfig = MosaicConfig.fromFile(options.mosaicConfig);
        tokenAddresses = TokenAddresses.fromMosaicConfig(mosaicConfig, auxiliaryChain);
      } else if (MosaicConfig.exists(originChain)) {
        const mosaicConfig = MosaicConfig.fromChain(originChain);
        tokenAddresses = TokenAddresses.fromMosaicConfig(mosaicConfig, auxiliaryChain);
      }

      if (!tokenAddresses) {
        console.error('Mosaic config or token config not found . Use --mosaic-config or --token-config option to provide path.');
        process.exit(1);
      }

      new SubGraph(
        originChain,
        auxiliaryChain,
        subgraphType,
        graphAdminRPC,
        graphIPFS,
        tokenAddresses,
      ).deploy();
    } catch (error) {
      Logger.error('error while executing mosaic libraries', { error: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
