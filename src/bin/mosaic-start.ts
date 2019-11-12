#!/usr/bin/env node

import * as commander from 'commander';
import * as markdownTable from 'markdown-table';
import NodeFactory from '../Node/NodeFactory';
import Node from '../Node/Node';
import NodeOptions from './NodeOptions';
import GraphOptions from './GraphOptions';
import GraphDescription from '../Graph/GraphDescription';
import Graph from '../Graph/Graph';
import NodeDescription from '../Node/NodeDescription';
import DevChainOptions from './DevChainOptions';
import Logger from '../Logger';
import { default as ChainInfo, GETH_CLIENT, PARITY_CLIENT } from '../Node/ChainInfo';
import Validator from './Validator';
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
    if (options.clefSigner) {
      Logger.error('Clef signer currently supports geth. Please refer clef documentation.');
      return false;
    }
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
  .option('-b,--bootnodes <bootnodes>', 'Path to bootnodes file for geth client')
  .option('-a, --clef-signer <clefsigner>', 'RPC or IPC endpoint of clef signer')

  .action(async (chain: string, options) => {
    try {
      let chainInput = chain;
      let optionInput = Object.assign({}, options);
      if (!validateCLIOptions(chain, optionInput)) {
        process.exit(1);
      }
      if (DevChainOptions.isDevChain(chain, options)) {
        const devParams = ChainInfo.getChainParams(chain, options);
        chainInput = devParams.chain;
        optionInput = devParams.options;
        // Dev chain should always start with geth.
        optionInput.client = GETH_CLIENT;
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
        bootNodesFile,
        clefSigner,
      } = NodeOptions.parseOptions(optionInput, chainInput);

      if (originChain && originChain.length > 0) {
        if (!Validator.isValidOriginChain(originChain)) {
          Logger.error(`Invalid origin chain identifier: ${originChain}`);
          process.exit(1);
        }

        if (!Validator.isValidAuxChain(chain, originChain)) {
          Logger.error(`Invalid aux chain identifier: ${chain}`);
          process.exit(1);
        }
      } else if (!Validator.isValidOriginChain(chain)) {
        Logger.error(`Invalid origin chain identifier: ${chain}`);
        process.exit(1);
      }

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
        bootNodesFile,
        clefSigner,
      };
      const node: Node = NodeFactory.create(nodeDescription);
      node.start();
      let graphDescription: GraphDescription;
      const isGraphServices = !optionInput.withoutGraphNode;
      if (isGraphServices) {
        graphDescription = GraphOptions.parseOptions(
          optionInput,
          chainInput,
        );
        // reuse params from node start command
        graphDescription.mosaicDir = mosaicDir;
        graphDescription.ethereumRpcPort = rpcPort;
        graphDescription.ethereumClient = nodeDescription.client;

        await (new Graph(graphDescription).start());
      }

      const ipAddress = Utils.ipAddress();
      // printing of endpoints on console.
      const chainEndPoints = markdownTable([
        ['Type', 'URL'],
        ['rpc', `http://${ipAddress}:${rpcPort}`],
        ['ws', `ws://${ipAddress}:${websocketPort}`],
      ], {
        align: ['c', 'c', 'c'],
      });

      console.log(`\n Below are the list of endpoints for ${chain} chain : \n${chainEndPoints}\n`);
      if (isGraphServices) {
        const graphNodeEndPoints = markdownTable([
          ['Type', 'URL'],
          ['rpc', `http://${ipAddress}:${graphDescription.rpcPort}`],
          ['ws', `ws://${ipAddress}:${graphDescription.websocketPort}`],
          ['admin', `http://${ipAddress}:${graphDescription.rpcAdminPort}`],
        ], {
          align: ['c', 'c', 'c', 'c'],
        });

        const postGresEndPoints = markdownTable([
          ['Type', 'URL'],
          ['rpc', `http://${ipAddress}:${graphDescription.postgresPort}`],
        ], {
          align: ['c', 'c'],
        });

        const ipfsEndPoints = markdownTable([
          ['Type', 'URL'],
          ['rpc', `http://${ipAddress}:${graphDescription.ipfsPort}`],
        ], {
          align: ['c', 'c'],
        });
        console.log(`\n Below are the list of endpoints for graph node : \n${graphNodeEndPoints}\n`);
        console.log(`\n Below are the list of endpoints for postgres db : \n${postGresEndPoints}\n`);
        console.log(`\n Below are the list of endpoints for ipfs : \n${ipfsEndPoints}\n`);
      }
    } catch (e) {
      Logger.error(`Error starting node: ${e} `);
    }
  })
  .parse(process.argv);
