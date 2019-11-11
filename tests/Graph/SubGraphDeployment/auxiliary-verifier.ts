#!/usr/bin/env node

import * as commander from 'commander';
import { SubscriptionClient } from 'subscriptions-transport-ws';

import Logger from '../../../src/Logger';

import WebSocket = require('ws');

const mosaic = commander
  .arguments('<graph-ws-port> <cogateway-address>');

mosaic.action(
  async (
    graphWsPort: string,
    cogatewayAddress: string,
  ) => {
    const subGraphName = `mosaic/auxiliary-${cogatewayAddress.substr(2, 22)}`;
    Logger.info(`subgraph name for verification   ${subGraphName}`);
    Logger.info(`graph ws port ${graphWsPort}`);
    const wsEndPoint = `ws://127.0.0.1:${graphWsPort}/subgraphs/name/${subGraphName}`;

    // Creates subscription client
    const subscriptionClient = new SubscriptionClient(wsEndPoint, {
      reconnect: true,
    },
    WebSocket);
    subscriptionClient.onConnected(() => {
      Logger.info(`Connected to sub graph: ${subGraphName} url: ${wsEndPoint}`);
      subscriptionClient.close();
      process.exit(0);
    });
    subscriptionClient.onError((error) => {
      Logger.error(`Could not connect to sub graph: ${subGraphName} url: ${wsEndPoint}`);
      Logger.error(`Error: ${error.message}`);
      process.exit(1);
    });
  },
)
  .parse(process.argv);
