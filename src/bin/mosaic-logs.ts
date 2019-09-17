#!/usr/bin/env node

import * as mosaic from 'commander';
import Shell from '../Shell';
import Node from '../Node/Node';
import NodeDescription from '../Node/NodeDescription';
import NodeFactory from '../Node/NodeFactory';
import DevChainOptions from './DevChainOptions';

mosaic
  .arguments('<chain>')
  .action((chain: string) => {
    let chainInput = chain;
    if (DevChainOptions.isDevChain(chain)) {
      chainInput = DevChainOptions.getDevChainParams(chain).chain;
    }
    const node: Node = NodeFactory.create(new NodeDescription(chainInput));
    const args = [
      'logs',
      '-f',
      node.getContainerName(),
    ];
    Shell.executeDockerCommand(args);
  })
  .parse(process.argv);
