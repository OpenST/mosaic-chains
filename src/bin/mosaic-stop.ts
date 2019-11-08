#!/usr/bin/env node

import * as mosaic from 'commander';
import NodeFactory from '../Node/NodeFactory';
import NodeDescription from '../Node/NodeDescription';
import Node from '../Node/Node';
import GraphDescription from '../Graph/GraphDescription';
import Graph from '../Graph/Graph';
import Utils from '../Utils';

mosaic
  .arguments('<chains...>')
  .action((chains: string[]) => {
    // Chain can't be validated as origin chain id is not received for aux chain.
    for (const chain of chains) {
      const chainId = Utils.getChainId(chain);
      const node: Node = NodeFactory.create(new NodeDescription(chainId));
      node.stop();
      const graph: Graph = new Graph(new GraphDescription(chainId));
      graph.stop();
    }
  })
  .parse(process.argv);
