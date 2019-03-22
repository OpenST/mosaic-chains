#!/usr/bin/env node

import * as mosaic from 'commander';
import { version } from '../../package.json';
import NodeFactory from '../Node/NodeFactory';
import Node from '../Node/Node';
import Logger from '../Logger';

// These defaults will be used if the relevant option is not given on the command line.
const DEFAULT_DATA_DIR = '~/.mosaic'
const DEFAULT_PORT = 30303;
const DEFAULT_RPC_PORT = 8545;
const DEFAULT_WS_PORT = 8645;

/**
 * Defines the available options of this command and their types.
 */
interface Options {
  mosaicDir: string;
  port: number;
  rpcPort: number;
  websocketPort: number;
  keepAfterStop: boolean;
  unlock: string;
  password: string;
}

/**
 * Checks if unlock or password were given as a command line option but not the other.
 * You have to give both options or none of them.
 * @param options The parsed command line options.
 * @returns True if one option was given but not the other.
 */
function unlockOrPasswordWithoutTheOther(options: Options): boolean {
  const { unlock, password } = options;

  if (unlock !== '' && password === '') {
    return true;
  }

  if (unlock === '' && password !== '') {
    return true;
  }

  return false;
}

/**
 * Parses the commander options and returns an Options object.
 * @param options Options as they are given by commander.
 * @returns The parsed options with defaults for options that are missing from the command line.
 */
function parseOptions(options): Options {
  const parsedOptions = {
    mosaicDir: options.mosaicDir || DEFAULT_DATA_DIR,
    port: options.port || DEFAULT_PORT,
    rpcPort: options.rpcPort || DEFAULT_RPC_PORT,
    websocketPort: options.wsPort || DEFAULT_WS_PORT,
    keepAfterStop: options.keep ? true : false,
    unlock: options.unlock || '',
    password: options.password || '',
  };

  if (unlockOrPasswordWithoutTheOther(parsedOptions)) {
    Logger.error('cannot use --unlock or --password without the other');
    process.exit(1);
  }

  return parsedOptions;
}

/**
 * Converts a given string to a decimal number.
 * @param string The string to convert.
 * @returns The parsed decimal.
 */
function stringToDecimal(string: string): number {
  return parseInt(string, 10);
}

mosaic
  .version(version)
  .arguments('<chains...>')
  .option('-d,--mosaic-dir <dir>', 'a path to a directory where the chain data will be stored', DEFAULT_DATA_DIR)
  .option('-p,--port <port>', 'the first port to use for forwarding from host to container', stringToDecimal, DEFAULT_PORT)
  .option('-r,--rpc-port <port>', 'the first RPC port to use for forwarding from host to container', stringToDecimal, DEFAULT_RPC_PORT)
  .option('-w,--ws-port <port>', 'the first WS port to use for forwarding from host to container', stringToDecimal, DEFAULT_WS_PORT)
  .option('-u,--unlock <accounts>', 'a comma separated list of accounts that get unlocked in the node; you must use this together with --password')
  .option('-s,--password <file>', 'the path to the password file on your machine; you must use this together with --unlock')
  .option('-k,--keep', 'if set, the container will not automatically be deleted when stopped')
  .action((chainIds: string[], options) => {
    let {
      mosaicDir,
      port,
      rpcPort,
      websocketPort,
      keepAfterStop,
      unlock,
      password,
    } = parseOptions(options);

    for (const chainId of chainIds) {
      const chain: Node = NodeFactory.create({
        chainId,
        mosaicDir,
        port,
        rpcPort,
        websocketPort,
        keepAfterStop,
        unlock,
        password,
      });

      chain.start();

      // Every additional chain will have all published docker ports increased by one.
      port += 1;
      rpcPort += 1;
      websocketPort += 1;
    }
  })
  .parse(process.argv);
