#!/usr/bin/env node

import * as mosaic from 'commander';
import { version } from '../../package.json';
import NodeFactory from '../Node/NodeFactory';
import NodeDescription from '../Node/NodeDescription';
import Node from '../Node/Node';
import GraphDescription from '../Graph/GraphDescription';
import Graph from '../Graph/Graph';

mosaic
  .version(version)
  .arguments('<chains...>')
  .action((chains: string[]) => {
    for (const chain of chains) {
      const node: Node = NodeFactory.create(new NodeDescription(chain));
      node.stop();
      const graph: Graph = new Graph(new GraphDescription(chain));
      graph.stop();
    }

  })
  .parse(process.argv);
