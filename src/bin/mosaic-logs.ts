#!/usr/bin/env node

import * as mosaic from 'commander';
import Shell from '../Shell';
import Node from '../Node/Node';
import NodeDescription from '../Node/NodeDescription';
import NodeFactory from '../Node/NodeFactory';
import DevChainOptions from './DevChainOptions';
import Validator from './Validator';

mosaic
  .arguments('<chain>')
  .action((chain: string) => {
    let chainInput = chain;
    if (DevChainOptions.isDevChain(chain)) {
      chainInput = DevChainOptions.getDevChainParams(chain).chain;
    }

    if (!(Validator.isValidOriginChain(chain) || Validator.isValidAuxChain(chain))) {
      console.error(`Invalid chain identifier: ${chain}`)
      process.exit(1);
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
