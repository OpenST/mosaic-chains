#!/usr/bin/env node

import * as commander from 'commander';
import NodeFactory from '../Node/NodeFactory';
import Node from '../Node/Node';
import NodeOptions from './NodeOptions';
import GraphOptions from './GraphOptions';
import GraphDescription from '../Graph/GraphDescription';
import SubGraphDeployer from '../Graph/SubGraphDeployer';
import Graph from '../Graph/Graph';
import DevChainOptions from './DevChainOptions';
import Logger from '../Logger';
import { GETH_CLIENT, PARITY_CLIENT } from '../Node/ChainInfo';

let mosaic = commander
  .arguments('<chain>');

mosaic = NodeOptions.addCliOptions(mosaic);
mosaic = GraphOptions.addCliOptions(mosaic);

/**
 * Validates client options
 * @param chain chain-identifier
 * @param options CLI options
 * @return
 */
function validateClientOption(chain, options) {
  const client:string = options.client;
  if (!client) {
    return true;
  }
  if (client !== PARITY_CLIENT && client !== GETH_CLIENT) {
    Logger.error(`Unsupported client ${client}`);
    return false;
  }
  if (DevChainOptions.isDevChain(chain, options) && client === PARITY_CLIENT) {
    Logger.error('Parity client is not supported for dev-chains');
    return false;
  }
  if (options.origin && client === PARITY_CLIENT) {
    Logger.error('Parity client is not supported for auxiliary-chains');
    return false;
  }
  return true;
}

/**
 * Validates CLI options
 * @param chain chain-identifier
 * @param options CLI options
 * @return
 */
function validateCLIOptions(chain, options) {
  return validateClientOption(chain, options);
}

mosaic
  .option('-u,--unlock <accounts>', 'a comma separated list of accounts that get unlocked in the node; you must use this together with --password')
  .option('-s,--password <file>', 'the path to the password file on your machine; you must use this together with --unlock')
  .option('-g,--withoutGraphNode', 'boolean flag which decides if graph node should be started')
  .action((chain: string, options) => {
    let chainInput = chain;
    let optionInput = Object.assign({}, options);
    if (!validateCLIOptions(chain, optionInput)) {
      process.exit(1);
    }
    if (DevChainOptions.isDevChain(chain, options)) {
      const devParams = DevChainOptions.getDevChainParams(chain, options);
      chainInput = devParams.chain;
      optionInput = devParams.options;
    }
    const {
      mosaicDir,
      port,
      rpcPort,
      websocketPort,
      keepAfterStop,
      unlock,
      password,
      originChain,
    } = NodeOptions.parseOptions(optionInput, chainInput);
    const node: Node = NodeFactory.create({
      chain: chainInput,
      mosaicDir,
      port,
      rpcPort,
      websocketPort,
      keepAfterStop,
      unlock,
      password,
      originChain,
      client: optionInput.client
    });
    node.start();

    if (!optionInput.withoutGraphNode) {
      const graphDescription: GraphDescription = GraphOptions.parseOptions(optionInput, chainInput);
      // reuse params from node start command
      graphDescription.mosaicDir = mosaicDir;
      graphDescription.ethereumRpcPort = rpcPort;

      new Graph(graphDescription).start().then(() => {
        let subGraphDeployer;
        // options.origin passed only in case of starting an auxiliary chain
        if (optionInput.origin) {
          subGraphDeployer = new SubGraphDeployer(graphDescription, optionInput.origin, chainInput);
        } else {
          subGraphDeployer = new SubGraphDeployer(graphDescription, chainInput, null);
        }
        return subGraphDeployer.deploy();
      });
    }
  })
  .parse(process.argv);
