#!/usr/bin/env node

import * as mosaic from 'commander';
import Shell from '../Shell';
import Node from '../Node/Node';
import NodeFactory from '../Node/NodeFactory';
import NodeDescription from '../Node/NodeDescription';
import DevChainOptions from './DevChainOptions';
import Validator from './Validator';
import { Logger } from '../../lib';

mosaic
  .arguments('<chain>')
  .action((chain: string) => {
    let chainInput = chain;
    if (DevChainOptions.isDevChain(chain)) {
      chainInput = DevChainOptions.getDevChainParams(chain).chain;
    }
    if (!(Validator.isValidOriginChain(chain) || Validator.isValidAuxChain(chain))) {
      Logger.error(`Invalid chain identifier: ${chain}`);
      process.exit(1);
    }
    const node: Node = NodeFactory.create(new NodeDescription(chainInput));

    const args = [
      'run',
      '--network', `${Node.network}`,
      '-it',
      '--rm',
      'ethereum/client-go',
      'attach',
      // Docker automatically resolves the container name to the IP if the container is spawned
      // within the same network (see `--network` above).
      // The port is always `8545` as that is always the same port for the nodes running *inside*
      // the containers.
      `http://${node.getContainerName()}:8545`,
    ];
    Shell.executeDockerCommand(args);
  })
  .parse(process.argv);
