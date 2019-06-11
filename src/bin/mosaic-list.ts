#!/usr/bin/env node

import * as mosaic from 'commander';
import Node from '../Node/Node';
import Shell from '../Shell';

mosaic
  .action(() => {
    const args = [
      'ps',
      '-a',
      '--filter', `name=${Node.prefix}`,
      '--format', 'table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}\t{{.ID}}',
    ];
    Shell.executeDockerCommand(args);
  })
  .parse(process.argv);
