#!/usr/bin/env node

import * as mosaic from 'commander';
import { version, description } from '../../package.json';

mosaic
  .version(version)
  .description(description)
  .command('start <chains...>', 'start containers running the given chains')
  .command('stop <chains...>', 'stop the containers that run the given chains')
  .command('attach <chain>', 'attach to the ethereum node of the given chain')
  .command('logs <chain>', 'follow the logs in the container of the given chain')
  .command('list', 'list all running containers that run a mosaic chain')
  .command('new <new-chain-id> <origin-websocket> <password-file>', 'initializes a new auxiliary chain on the given origin chain')
  .parse(process.argv);
