#!/usr/bin/env node

import * as mosaic from 'commander';
import NodeFactory from '../Node/NodeFactory';
import NodeDescription from '../Node/NodeDescription';
import Node from '../Node/Node';

mosaic
  .arguments('<chains...>')
  .action((chains: string[]) => {
    for (const chain of chains) {
      const node: Node = NodeFactory.create(new NodeDescription(chain));

      node.stop();
    }
  })
  .parse(process.argv);
