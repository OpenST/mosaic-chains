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
      'logs',
      '-f',
      `${Chain.prefix}${chainId}`,
    ];
    Shell.executeDockerCommand(args);
  })
  .parse(process.argv);
