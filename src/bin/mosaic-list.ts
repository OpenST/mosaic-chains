#!/usr/bin/env node

import * as mosaic from 'commander';
import { version } from '../../package.json';
import Chain from '../Chain/Chain'
import Shell from '../Shell';

mosaic
  .version(version)
  .action(() => {
    const args = [
      'ps',
      '-a',
      '--filter', `name=${Chain.prefix}`,
      '--format', 'table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}\t{{.ID}}',
    ];
    Shell.executeDockerCommand(args);
  })
  .parse(process.argv);
