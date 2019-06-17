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
];

function writeToFile(name, abi, contractVersion): void {
  const patchVersionIndex = contractVersion.lastIndexOf('.');
  const majorMinorVersion = contractVersion.slice(0, patchVersionIndex);
  const directory = path.join(
    Directory.projectRoot,
    abiFolder,
    majorMinorVersion,
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

const contracts = Object.keys(mosaicContract);
contracts.filter(c => allowedABIs.indexOf(c) !== -1)
  .map(contract => writeToFile(contract, mosaicContract[contract].abi, version));
