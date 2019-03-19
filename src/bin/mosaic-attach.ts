#!/usr/bin/env node

import * as mosaic from 'commander';
import { version } from '../../package.json';
import Shell from '../Shell';
import Chain from '../Chain/Chain';

mosaic
  .version(version)
  .arguments('<chain>')
  .action((chainId) => {
    const args = [
      'run',
      '--network', `${Chain.network}`,
      '-it',
      '--rm',
      'ethereum/client-go',
      'attach',
      `http://${Chain.prefix}${chainId}:8545`
    ];
    Shell.executeDockerCommand(args);
  })
  .parse(process.argv);
