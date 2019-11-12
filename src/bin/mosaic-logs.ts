#!/usr/bin/env node

import * as mosaic from 'commander';
import Shell from '../Shell';
import Node from '../Node/Node';
import NodeDescription from '../Node/NodeDescription';
import NodeFactory from '../Node/NodeFactory';
import ChainInfo from '../Node/ChainInfo';

mosaic
  .arguments('<chain>')
  .action((chain: string) => {
    const chainIdentifier = ChainInfo.getChainParams(chain).chain;
    // Chain can't be validated as origin chain id is not received for aux chain.
    const node: Node = NodeFactory.create(new NodeDescription(chainIdentifier));
    const args = [
      'logs',
      '-f',
      node.getContainerName(),
    ];
    Shell.executeDockerCommand(args);
  })
  .parse(process.argv);
