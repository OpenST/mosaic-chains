import * as web3Utils from 'web3-utils';
import * as fs from 'fs';
import * as path from 'path';
import ChainInfo from '../Node/ChainInfo';
import Directory from '../Directory';

/**
 * This is contains methods to validate command arguments.
 */
export default class Validator {
  /**
   * This method validates a ethereum address.
   * @param value Ethereum address.
   */
  public static isValidAddress(value: string): boolean {
    return web3Utils.isAddress(value);
  }

  /**
   * This method validates a validate origin chain.
   * @param value Chain identifier.
   */
  public static isValidOriginChain(value: string): boolean {
    return !!ChainInfo.publicOriginChainNameToIdMap[value];
  }

  /**
   * This method validates a validate aux chain.
   * @param auxChain Chain identifier.
   */
  public static isValidAuxChain(auxChain: string): boolean {
    let validAuxChain = false;
    const chainDir = Directory.getProjectChainsDirectory;
    const originChainDirectories = Validator.getDirectories(chainDir);
    originChainDirectories.forEach((originChain) => {
      const auxDirectory = Directory.getProjectUtilityChainDir(originChain, auxChain);
      if (fs.existsSync(auxDirectory)) {
        validAuxChain = true;
      }
    });
    return validAuxChain;
  }

  /**
   * This function returns directories inside a folder.
   * @param folderPath Path of folder.
   */
  private static getDirectories(folderPath) {
    return fs.readdirSync(folderPath)
      .map(file => ({
        fullPath: path.join(folderPath, file),
        name: file,
      }))
      .filter(dir => fs.statSync(dir.fullPath).isDirectory())
      .map(dir => dir.name);
  }
}
