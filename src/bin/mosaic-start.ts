#!/usr/bin/env node

import * as mosaic from 'commander';
import { version } from '../../package.json';
import ChainFactory from '../Chain/ChainFactory';
import Chain from '../Chain/Chain';

// These defaults will be used if the relevant option is not given on the command line.
const DEFAULT_DATA_DIR = '~/.mosaic'
const DEFAULT_PORT = 30303;
const DEFAULT_RPC_PORT = 8545;
const DEFAULT_WS_PORT = 8646;

/**
 * Defines the available options of this command and their types.
 */
interface Options {
  dataDir: string;
  port: number;
  rpcPort: number;
  wsPort: number;
}

/**
 * Parses the commander options and returns an Options object.
 * @param options Options as they are given by commander.
 * @returns The parsed options with defaults for options that are missing from the command line.
 */
function parseOptions(options): Options {
  const parsedOptions = {
    dataDir: options.dataDir || DEFAULT_DATA_DIR,
    port: options.port || DEFAULT_PORT,
    rpcPort: options.rpcPort || DEFAULT_RPC_PORT,
    wsPort: options.wsPort || DEFAULT_WS_PORT,
  };

  return parsedOptions;
}

mosaic
  .version(version)
  .arguments('<chains...>')
  .option('-d,--data-dir <dir>', 'a path to a directory where the chain data will be stored', DEFAULT_DATA_DIR)
  .option('-p,--port <port>', 'the first port to use for forwarding from host to container', parseInt, DEFAULT_PORT)
  .option('-r,--rpc-port <port>', 'the first RPC port to use for forwarding from host to container', parseInt, DEFAULT_RPC_PORT)
  .option('-w,--ws-port <port>', 'the first WS port to use for forwarding from host to container', parseInt, DEFAULT_WS_PORT)
  .action((chainIds, options) => {
    let {
      dataDir,
      port,
      rpcPort,
      wsPort
    } = parseOptions(options);

    for (const chainId of chainIds) {
      const chain: Chain = ChainFactory.build(
        chainId,
        dataDir,
        port,
        rpcPort,
        wsPort,
      );

      chain.start();

      // Every additional chain will have all published docker ports increased by one.
      port += 1;
      rpcPort += 1;
      wsPort += 1;
    }
  })
  .parse(process.argv);
