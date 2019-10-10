#!/usr/bin/env node

import * as commander from 'commander';

import Logger from '../Logger';
import MosaicConfig from '../Config/MosaicConfig';
import SubGraph, {SubGraphType} from '../Graph/SubGraph';

const mosaic = commander
  .arguments('<originChain> <auxiliaryChain> <subgraphType> <graphAdminRPC> <graphIPFS>');

mosaic.option('-m,--mosaic-config <string>', 'Mosaic config absolute path');
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
      let mosaicConfig;
      if (options.mosaicConfig) {
        mosaicConfig = MosaicConfig.fromFile(options.mosaicConfig);
      } else if (MosaicConfig.exists(originChain)) {
        mosaicConfig = MosaicConfig.fromChain(originChain);
      }

      if (!mosaicConfig) {
        console.error(`Mosaic config not found for chain ${originChain} on default location. Use --mosaic-config option to provide path.`);
        process.exit(1);
      }

      new SubGraph(
        originChain,
        auxiliaryChain,
        subgraphType,
        graphAdminRPC,
        graphIPFS,
        mosaicConfig,
      ).deploy();
    } catch (error) {
      Logger.error('error while executing mosaic libraries', {error: error.toString()});
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
