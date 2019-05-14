#!/usr/bin/env node

import * as mosaic from 'commander';
import { version } from '../../package.json';
import NodeFactory from '../Node/NodeFactory';
import NodeDescription from '../Node/NodeDescription';
import Node from '../Node/Node';

mosaic
  .version(version)
  .arguments('<chains...>')
  .action((chainIds: string[]) => {
    for (const chainId of chainIds) {
      const chain: Node = NodeFactory.create(new NodeDescription(chainId));

      chain.stop();
    }
  })
  .parse(process.argv);
