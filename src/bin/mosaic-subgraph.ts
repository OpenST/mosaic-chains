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
      let gatewayAddresses: GatewayAddresses;
      let gatewayConfig: GatewayConfig;
      let mosaicConfig: MosaicConfig;

      if (options.gatewayConfig) {
        gatewayConfig = GatewayConfig.fromFile(options.gatewayConfig);
      } else if (options.gatewayAddress) {
        gatewayConfig = GatewayConfig.fromChain(
          originChain,
          parseInt(auxiliaryChain),
          options.gatewayAddress,
        );
      }

      if (options.mosaicConfig) {
        mosaicConfig = MosaicConfig.fromFile(options.mosaicConfig);
      } else if (MosaicConfig.exists(originChain)) {
        mosaicConfig = MosaicConfig.fromChain(originChain);
      }

      if (gatewayConfig) {
        if (parseInt(auxiliaryChain) !== gatewayConfig.auxChainId) {
          Logger.error(`Auxiliary chain id in gateway config is ${gatewayConfig.auxChainId} but value passed is ${auxiliaryChain}`);
          process.exit(1);
        }
        gatewayAddresses = GatewayAddresses.fromGatewayConfig(gatewayConfig);
      } else if (mosaicConfig) {
        if (mosaicConfig.originChain.chain !== originChain) {
          Logger.error(`Origin chain id in mosaic config is ${mosaicConfig.originChain.chain} but received argument is ${originChain}`);
          process.exit(1);
        }
        gatewayAddresses = GatewayAddresses.fromMosaicConfig(
          mosaicConfig,
          auxiliaryChain.toString(),
        );
      }

      if (!gatewayAddresses) {
        Logger.error('Mosaic config or gateway config not found . Use --mosaic-config or --gateway-config option to provide path.');
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
      Logger.error('error while executing mosaic subgraph command', { error: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
