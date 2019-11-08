#!/usr/bin/env node

import * as mosaic from 'commander';
import Shell from '../Shell';
import Node from '../Node/Node';
import NodeDescription from '../Node/NodeDescription';
import NodeFactory from '../Node/NodeFactory';
import Utils from '../Utils';

mosaic
  .arguments('<chain>')
  .action((chain: string) => {
    const chainId = Utils.getChainId(chain);
    // Chain can't be validated as origin chain id is not received for aux chain.
    const node: Node = NodeFactory.create(new NodeDescription(chainId));
    const args = [
      'logs',
      '-f',
      node.getContainerName(),
    ];
    Shell.executeDockerCommand(args);
  })
  .parse(process.argv);
