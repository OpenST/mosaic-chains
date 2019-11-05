#!/usr/bin/env node

import * as commander from 'commander';
import * as markdownTable from 'markdown-table';
import Logger from '../Logger';
import { SubGraphType } from '../Graph/SubGraph';
import deploySubGraph from '../lib/SubGraph';
import Utils from '../Utils';

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
      const response = deploySubGraph(
        originChain,
        auxiliaryChain,
        subgraphType,
        graphAdminRPC,
        graphIPFS,
        options.mosaicConfig,
        options.gatewayAddress,
        options.gatewayConfig,
      );

      if (response.success) {
        const details = markdownTable([
          ['Chain',
            'Subgraph name',
            'Subgraph websocket endpoint',
            'Subgraph rpc endpoint',
          ],
          [
            subgraphType,
            response.subgraphName,
            Utils.graphWSEndpoint(response.subgraphName),
            Utils.graphRPCEndPoint(response.subgraphName),
          ],
        ], {
          align: ['c', 'c', 'c', 'c'],
        });

        console.log(`\n\n Sub-graph details : \n${details}\n`);
        console.log('ℹ️ Replace host, ws-port and http-port with actual values');
      } else {
        console.log('\n\n Subgraph deployment failed.😱');
      }
    } catch (error) {
      Logger.error('error while executing mosaic subgraph command', { error: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
