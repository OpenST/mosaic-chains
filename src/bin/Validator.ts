import * as web3Utils from 'web3-utils';
import * as fs from 'fs';
import * as path from 'path';
import ChainInfo from '../Node/ChainInfo';
import Directory from '../Directory';
import MosaicConfig from '../Config/MosaicConfig';

/**
 * This class contains methods to validate commandline  arguments.
 */
export default class Validator {
  /**
   * This method validates an ethereum address.
   * @param value Ethereum address.
   */
  public static isValidAddress(value: string): boolean {
    return web3Utils.isAddress(value);
  }

  /**
   * This method validates an origin chain.
   * @param value Chain identifier.
   */
  public static isValidOriginChain(value: string): boolean {
    return !!ChainInfo.publicOriginChainNameToIdMap[value] || ChainInfo.isDevChain(value);
  }

  /**
   * This method validates an aux chain.
   * @param auxChain Chain identifier.
   * @param originChainId Origin chain identifier.
   */
  public static isValidAuxChain(auxChain: string, originChainId: string): boolean {
    if (MosaicConfig.exists(originChainId)) {
      const mosaicConfig = MosaicConfig.fromChain(originChainId);
      if (mosaicConfig.auxiliaryChains[auxChain]) {
        return true;
      }
    }
    if (ChainInfo.isDevChain(auxChain)) {
      return true;
    }
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
