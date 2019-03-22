#!/usr/bin/env node

import * as mosaic from 'commander';
import { version } from '../../package.json';
import Shell from '../Shell';
import Node from '../Node/Node'
import NodeDescription from '../Node/NodeDescription'
import NodeFactory from '../Node/NodeFactory'

mosaic
  .version(version)
  .arguments('<chain>')
  .action((chainId: string) => {
    const node: Node = NodeFactory.create(new NodeDescription(chainId));
    const args = [
      'logs',
      '-f',
      node.getContainerName(),
    ];
    Shell.executeDockerCommand(args);
  })
  .parse(process.argv);
