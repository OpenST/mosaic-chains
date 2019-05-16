#!/usr/bin/env node

import * as mosaic from 'commander';
import { version } from '../../package.json';
import NodeFactory from '../Node/NodeFactory';
import NodeDescription from '../Node/NodeDescription';
import Node from '../Node/Node';

mosaic
  .version(version)
  .arguments('<chains...>')
  .action((chains: string[]) => {
    for (const currentChain of chains) {
      const chain: Node = NodeFactory.create(new NodeDescription(currentChain));

      chain.stop();
    }
  })
  .parse(process.argv);
