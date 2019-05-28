#!/usr/bin/env node

import * as mosaic from 'commander';
import { version, description } from '../../package.json';

mosaic
  .version(version)
  .description(description)
  .command('start <chain>', 'start container that runs a given chain')
  .command('stop <chains...>', 'stop the containers that run the given chains')
  .command('attach <chain>', 'attach to the ethereum node of the given chain')
  .command('logs <chain>', 'follow the logs in the container of the given chain')
  .command('list', 'list all running containers that run a mosaic chain')
  .command('create <new-chain-id> <origin-websocket> <password-file>', 'creates a new auxiliary chain on the given origin chain')
  .command('libraries <chain> <origin-websocket> <deployer>', 'Deploys libraries on an origin chain')
  .parse(process.argv);
