import * as path from "path";
import * as fs from "fs-extra";

const mosaicContract = require('@openst/mosaic-contracts');

import Logger from "../../src/Logger";
import Directory from "../../src/Directory";

const args = process.argv.slice(2);
const version = args[0];
const abi_folder = './abi';

const contracts = Object.keys(mosaicContract);
contracts.map(contract =>
    writeToFile(contract, mosaicContract[contract].abi, version)
);

function writeToFile(name, abi, version) {

    const directory = path.join(
        Directory.projectRoot,
        abi_folder,
        version
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