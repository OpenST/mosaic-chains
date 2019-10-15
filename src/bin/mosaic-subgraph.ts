#!/usr/bin/env node

import * as commander from 'commander';

import Logger from '../Logger';
import MosaicConfig from '../Config/MosaicConfig';
import SubGraph, { SubGraphType } from '../Graph/SubGraph';
import GatewayAddresses from '../Config/GatewayAddresses';
import GatewayConfig from '../Config/GatewayConfig';

const mosaic = commander
  .arguments('<originChain> <auxiliaryChain> <subgraphType> <graphAdminRPC> <graphIPFS>');

mosaic.option('-m,--mosaic-config <string>', 'Mosaic config absolute path.');
mosaic.option('-t,--gateway-config <string>', 'Gateway config absolute path.');
mosaic.option('-a,--auxiliary <string>', 'auxiliary chain identifier.');
mosaic.option('-g,--gateway-address <string>', 'gateway address of origin.');
mosaic.action(
  async (
    originChain: string,
    auxiliaryChain: number,
    subgraphType: SubGraphType,
    graphAdminRPC: string,
    graphIPFS: string,
    options,
  ) => {
    try {
      let gatewayAddresses;
      let gatewayConfig;
      let mosaicConfig;

      if (options.gatewayConfig) {
        gatewayConfig = GatewayConfig.fromFile(options.gatewayConfig);
      } else if (options.gatewayAddress) {
        gatewayConfig = GatewayConfig.fromChain(
          originChain,
          auxiliaryChain,
          options.gatewayAddress,
        );
      }

      if (options.mosaicConfig) {
        mosaicConfig = MosaicConfig.fromFile(options.mosaicConfig);
      } else if (MosaicConfig.exists(originChain)) {
        mosaicConfig = MosaicConfig.fromChain(originChain);
      }

      if (gatewayConfig) {
        if (auxiliaryChain !== gatewayConfig.auxChainId) {
          console.error(`Auxiliary chain id in gateway config is ${gatewayConfig.auxChainId} but value passed is ${auxiliaryChain}`);
          process.exit(1);
        }
        gatewayAddresses = GatewayAddresses.fromGatewayConfig(gatewayConfig);
      } else if (mosaicConfig) {
        gatewayAddresses = GatewayAddresses.fromMosaicConfig(
          mosaicConfig,
          auxiliaryChain.toString(),
        );
      }

      if (!gatewayAddresses) {
        console.error('Mosaic config or token config not found . Use --mosaic-config or --token-config option to provide path.');
        process.exit(1);
      }

      new SubGraph(
        originChain,
        auxiliaryChain.toString(),
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
