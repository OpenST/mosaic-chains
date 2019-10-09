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
import Validator from './Validator';

let mosaic = commander
  .arguments('<chain>');

mosaic = NodeOptions.addCliOptions(mosaic);
mosaic = GraphOptions.addCliOptions(mosaic);

mosaic
  .option('-u,--unlock <accounts>', 'a comma separated list of accounts that get unlocked in the node; you must use this together with --password')
  .option('-s,--password <file>', 'the path to the password file on your machine; you must use this together with --unlock')
  .option('-g,--withoutGraphNode', 'boolean flag which decides if graph node should be started')
  .action((chain: string, options) => {
    let chainInput = chain;
    let optionInput = Object.assign({}, options);
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

    if (originChain && originChain.length > 0) {
      if (!Validator.isValidOriginChain(originChain)) {
        console.error(`Invalid origin chain identifier: ${originChain}`)
        process.exit(1);
      }

      if (!Validator.isValidAuxChain(chain)) {
        console.error(`Invalid aux chain identifier: ${chain}`)
        process.exit(1);
      }
    } else if (!Validator.isValidOriginChain(chain)) {
      console.error(`Invalid orgiin chain identifier: ${chain}`)
      process.exit(1);
    }

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
