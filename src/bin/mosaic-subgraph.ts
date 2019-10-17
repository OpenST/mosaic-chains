#!/usr/bin/env node

import * as commander from 'commander';
import Logger from '../Logger';
import { SubGraphType } from '../Graph/SubGraph';
import deploySubGraph from '../lib/SubGraph';

const mosaic = commander
  .arguments('<originChain> <auxiliaryChain> <subgraphType> <graphAdminRPC> <graphIPFS>');

mosaic.option('-m,--mosaic-config <string>', 'Mosaic config absolute path.');
mosaic.option('-t,--gateway-config <string>', 'Gateway config absolute path.');
mosaic.option('-g,--gateway-address <string>', 'gateway address of origin.');
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
      deploySubGraph(
        originChain,
        auxiliaryChain,
        subgraphType,
        graphAdminRPC,
        graphIPFS,
        options.mosaicConfig,
        options.gatewayAddress,
        options.gatewayConfig,
      );
    } catch (error) {
      Logger.error('error while executing mosaic subgraph command', { error: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
