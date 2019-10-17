#!/usr/bin/env node

import * as mosaic from 'commander';

mosaic
  .command('start <chain>', 'start container that runs a given chain')
  .command('stop <chains...>', 'stop the containers that run the given chains')
  .command('attach <chain>', 'attach to the ethereum node of the given chain')
  .command('logs <chain>', 'follow the logs in the container of the given chain')
  .command('list', 'list all running containers that run a mosaic chain')
  .command('create <new-chain-id> <origin-websocket> <password-file>', 'creates a new auxiliary chain on the given origin chain')
  .command('libraries <chain> <origin-websocket> <deployer>', 'Deploys libraries on an origin chain')
  .command('verify-chain <origin-websocket> <auxiliary-websocket> <origin-chain-identifier> <auxiliary-chain-identifier>', 'Verifies an auxiliary chain.')
  .command('setup-redeem-pool <originChain> <auxiliaryChain> <auxChainWeb3EndPoint> <deployer> <organizationOwner> <organizationAdmin>', 'Deploys redeem pool contract.')
  .command('setup-stake-pool <chain> <origin-websocket> <deployer> <organizationOwner> <organizationAdmin>', 'Deploys stake pool contract.')
  .command('subgraph <originChain> <auxiliaryChain> <subgraphType> <graphAdminRPC> <graphIPFS>', 'Deploys mosaic subgraph on a graph node')
  .on('command:*', (command) => {
    // First argument is the command name.
    const firstCommand = command[0];
    // Check if command is implemented.
    const searchedCommand = mosaic.commands.find(c => c._name === firstCommand);
    if (!searchedCommand) {
      console.error('Invalid command: %s\nSee --help for a list of available commands.', mosaic.args.join(' '));
      process.exit(1);
    }
    const requiredArgsCount = searchedCommand._args.filter(cmd => cmd.required).length;
    // Check for required arguments.
    if ((command.length - 1) < requiredArgsCount) {
      console.error('Missing required argument: See --help for details.');
      process.exit(1);
    }
  })
  .parse(process.argv);
