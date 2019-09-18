#!/usr/bin/env node

import * as mosaic from 'commander';
import NodeFactory from '../Node/NodeFactory';
import NodeDescription from '../Node/NodeDescription';
import Node from '../Node/Node';
import GraphDescription from '../Graph/GraphDescription';
import Graph from '../Graph/Graph';
import DevChainOptions from './DevChainOptions';

mosaic
  .arguments('<chains...>')
  .action((chains: string[]) => {
    for (const chain of chains) {
      let chainInput = chain;
      if (DevChainOptions.isDevChain(chain)) {
        chainInput = DevChainOptions.getDevChainParams(chain).chain;
      }
      const node: Node = NodeFactory.create(new NodeDescription(chainInput));
      node.stop();
      const graph: Graph = new Graph(new GraphDescription(chainInput));
      graph.stop();
    }
  })
  .parse(process.argv);
