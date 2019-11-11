import * as path from 'path';
import * as fs from 'fs-extra';

import Logger from '../../src/Logger';
import Directory from '../../src/Directory';

import mosaicContract = require('@openst/mosaic-contracts');

const args = process.argv.slice(2);
const version = args[0];
const abiFolder = './abi';
const allowedABIs = [
  'Anchor',
  'OSTComposer',
  'EIP20Gateway',
  'EIP20CoGateway',
  'RedeemPool',
];

/**
 * This method removes patch contractVersion from the contractVersion if any.
 * @param contractVersion Version of contract.
 */
function getMajorMinorVersion(contractVersion: string): string {
  // Check if patch version exists.
  if (contractVersion.split('.').length > 2) {
    const patchVersionIndex = contractVersion.lastIndexOf('.');
    return contractVersion.slice(0, patchVersionIndex);
  }
  return contractVersion;
}

/**
 * This method write abi to files.
 * @param name Name of the contract.
 * @param abi Contract ABI.
 * @param contractVersion Version of contract.
 */
function writeToFile(name: string, abi: object, contractVersion: string): void {
  const directory = path.join(
    Directory.projectRoot,
    abiFolder,
    getMajorMinorVersion(contractVersion),
  );
  fs.ensureDirSync(directory);
  const filePath = path.join(
    directory,
    `${name}.json`,
  );
  Logger.info(`storing ${name} abi to path ${filePath} `);

  fs.writeFileSync(
    filePath,
    JSON.stringify(abi, null, '    '),
  );
}


const contracts = Object.keys(mosaicContract.contracts);
contracts.filter(c => allowedABIs.indexOf(c) !== -1)
  .map(contract => writeToFile(contract, mosaicContract.contracts[contract].abi, version));
