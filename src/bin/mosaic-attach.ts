#!/usr/bin/env node

import * as mosaic from 'commander';
import Shell from '../Shell';
import Node from '../Node/Node';
import NodeFactory from '../Node/NodeFactory';
import NodeDescription from '../Node/NodeDescription';
import ChainInfo from '../Node/ChainInfo';

mosaic
  .arguments('<chain>')
  // Chain can't be validated as origin chain id is not received for aux chain.
  .action((chain: string) => {
    const chainIdentifier = ChainInfo.getChainParams(chain).chain;
    const node: Node = NodeFactory.create(new NodeDescription(chainIdentifier));

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
