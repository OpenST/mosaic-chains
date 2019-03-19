#!/usr/bin/env node

import * as mosaic from 'commander';
import { version } from '../../package.json';
import ChainFactory from '../Chain/ChainFactory';
import Chain from '../Chain/Chain';

mosaic
  .version(version)
  .arguments('<chains...>')
  .action((chainIds) => {

    for (const chainId of chainIds) {
      const chain: Chain = ChainFactory.build(chainId);

      chain.stop();
    }
  })
  .parse(process.argv);
