#!/usr/bin/env node

import * as mosaic from 'commander';
import Shell from '../Shell';
import Node from '../Node/Node';
import NodeDescription from '../Node/NodeDescription';
import NodeFactory from '../Node/NodeFactory';

mosaic
  .arguments('<chain>')
  .action((chain: string) => {
    const node: Node = NodeFactory.create(new NodeDescription(chain));
    const args = [
      'logs',
      '-f',
      node.getContainerName(),
    ];
    Shell.executeDockerCommand(args);
  })
  .parse(process.argv);
