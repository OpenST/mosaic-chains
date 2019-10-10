#!/usr/bin/env node

import * as commander from 'commander';
import NodeFactory from '../Node/NodeFactory';
import Node from '../Node/Node';
import NodeOptions from './NodeOptions';
import GraphOptions from './GraphOptions';
import GraphDescription from '../Graph/GraphDescription';
import SubGraphDeployer from '../Graph/SubGraphDeployer';
import Graph from '../Graph/Graph';
import NodeDescription from '../Node/NodeDescription';
import DevChainOptions from './DevChainOptions';
import Logger from '../Logger';
import { default as ChainInfo, GETH_CLIENT, PARITY_CLIENT } from '../Node/ChainInfo';
import Utils from '../Utils';

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
  const { client } = options;
  if (!client) {
    return true;
  }
  if (client !== PARITY_CLIENT && client !== GETH_CLIENT) {
    Logger.error(`Unsupported client ${client}`);
    return false;
  }
  if (client === PARITY_CLIENT) {
    if (!ChainInfo.chainsSupportedByParity.includes(chain)) {
      Logger.error(`Parity client does not support chain: ${chain}`);
      return false;
    }
    if (options.origin) {
      Logger.error('Parity client is not supported for auxiliary-chains');
      return false;
    }
    if (DevChainOptions.isDevChain(chain, options)) {
      Logger.error('Parity client is not supported for dev-chains');
      return false;
    }
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
  .option('-z,--rpcApi <rpcApi>','rpc api to be exposed when chain starts')
  .option('-y,--wsApi <wsApi>','ws rpi to be exposed when chain starts')
  .action((chain: string, options) => {
    let chainInput = chain;
    let optionInput = Object.assign({}, options);
    if (!validateCLIOptions(chain, optionInput)) {
      process.exit(1);
    }

    if(optionInput.rpcApi && !(Utils.validateMandatoryApiForGraphNode(optionInput.rpcApi))) {
      Logger.error(`mandatory rpc api ${Utils.mandatoryApiForGraphNode} for graphnode not found`);
      process.exit(1);
    }

    if(optionInput.wsApi && !(Utils.validateMandatoryApiForGraphNode(optionInput.wsApi))) {
      Logger.error(`mandatory ws api ${Utils.mandatoryApiForGraphNode} for graphnode not found`);
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
      rpcApi,
      wsApi,
    } = NodeOptions.parseOptions(optionInput, chainInput);
    const nodeDescription: NodeDescription = {
      chain: chainInput,
      mosaicDir,
      port,
      rpcPort,
      websocketPort,
      keepAfterStop,
      unlock,
      password,
      originChain,
      client: optionInput.client,
      rpcApi,
      wsApi,
    };
    const node: Node = NodeFactory.create(nodeDescription);
    node.start();

    if (!optionInput.withoutGraphNode) {
      const graphDescription: GraphDescription = GraphOptions.parseOptions(optionInput, chainInput);
      // reuse params from node start command
      graphDescription.mosaicDir = mosaicDir;
      graphDescription.ethereumRpcPort = rpcPort;
      graphDescription.ethereumClient = nodeDescription.client;

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
