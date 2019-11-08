import * as path from 'path';
import * as fs from 'fs-extra';

import { Validator } from 'jsonschema';
import Directory from '../Directory';
import Logger from '../Logger';
import { InvalidMosaicConfigException, MosaicConfigNotFoundException } from '../Exception';

const schema = require('./MosaicConfig.schema.json');

/**
 * Hold contract addresses on origin chain independent of auxiliary chain.
 */
export class OriginLibraries {
  public valueTokenAddress: Address;

  public merklePatriciaLibAddress: Address;

  public gatewayLibAddress: Address;

  public messageBusAddress: Address;

  public stakePoolAddress: Address;
}

/**
 * Holds origin chain specific config.
 */
export class OriginChain {
  public chain: string;

  public contractAddresses: OriginLibraries;

  public constructor() {
    this.contractAddresses = new OriginLibraries();
  }
}

/**
 * Contract addresses of the origin chain specific to an auxiliary chain.
 */
export class OriginContracts {
  public baseTokenAddress: Address;

  public anchorOrganizationAddress: Address;

  public anchorAddress: Address;

  public gatewayOrganizationAddress: Address;

  public eip20GatewayAddress: Address;
}

/**
 * Contract addresses deployed on the auxiliary chain.
 */
export class AuxiliaryContracts {
  public utilityTokenAddress: Address;

  public anchorOrganizationAddress: Address;

  public anchorAddress: Address;

  public merklePatriciaLibAddress: Address;

  public gatewayLibAddress: Address;

  public messageBusAddress: Address;

  public coGatewayOrganizationAddress: Address;

  public eip20CoGatewayAddress: Address;

  public redeemPoolAddress: Address;
}

/**
 * Hold contract addresses of origin and auxiliary chain specific to an auxiliary chain.
 */
export class ContractAddresses {
  public origin: OriginContracts;

  public auxiliary: AuxiliaryContracts;

  public constructor() {
    this.origin = new OriginContracts();
    this.auxiliary = new AuxiliaryContracts();
  }
}

/**
 * Holds config of an auxiliary chain.
 */
export class AuxiliaryChain {
  public chainId: number;

  public bootNodes: string[];

  public genesis: Record<string, any>;

  public contractAddresses: ContractAddresses;

  public constructor() {
    this.bootNodes = [];
    this.contractAddresses = new ContractAddresses();
  }
}

export type Address = string;

/**
 * Holds the config of mosaic chains of a specific origin chain.
 */
export default class MosaicConfig {
  public originChain: OriginChain;

  public auxiliaryChains: { [key: string]: AuxiliaryChain };

  private constructor(config: any) {
    this.originChain = config.originChain || new OriginChain();
    this.auxiliaryChains = config.auxiliaryChains || {};
  }

  /**
   * @param originChain chain identifier
   * @return mosaic config
   */
  public static fromChain(originChain: string): MosaicConfig {
    if (MosaicConfig.exists(originChain)) {
      const filePath = Directory.getMosaicConfigPath(originChain);
      const configObject = MosaicConfig.readConfigFromFile(filePath);
      return new MosaicConfig(configObject);
    }
    return new MosaicConfig({} as any);
  }

  /**
   * @param {string} filePath absolute path
   * @return {MosaicConfig}
   */
  public static fromFile(filePath: string): MosaicConfig {
    if (fs.existsSync(filePath)) {
      const configObject = MosaicConfig.readConfigFromFile(filePath);
      return new MosaicConfig(configObject);
    }
    throw new MosaicConfigNotFoundException(`Missing config file at path: ${filePath}`);
  }

  /**
   * Checks if mosaic config exists for a origin chain.
   * @param originChain chain identifier.
   */
  public static exists(originChain: string): boolean {
    const filePath = Directory.getMosaicConfigPath(originChain);
    return fs.existsSync(filePath);
  }

  /**
   * Saves this config to a file in its auxiliary chain directory.
   */
  public writeToMosaicConfigDirectory(): void {
    const mosaicConfigDir = path.join(
      Directory.getDefaultMosaicDataDir,
      this.originChain.chain,
    );

    fs.ensureDirSync(mosaicConfigDir);
    const configPath = Directory.getMosaicConfigPath(this.originChain.chain);
    Logger.info('storing mosaic config', { configPath });
    fs.writeFileSync(
      configPath,
      JSON.stringify(this, null, '    '),
    );
  }

  /**
   * This writes mosaic config to given path.
   * @param mosaicConfigPath Path of mosaic-config.
   */
  public writeToFile(mosaicConfigPath: string): void{
    Logger.info('storing mosaic config', { mosaicConfigPath });
    fs.writeFileSync(
      mosaicConfigPath,
      JSON.stringify(this, null, '    '),
    );
  }

  /**
   * read config from file, validate it and return as JSON object
   * @param {string} filePath
   * @return {object}
   */
  private static readConfigFromFile(filePath: string): object {
    const configString = fs.readFileSync(filePath).toString();
    if (configString && configString.length > 0) {
      const configObject = JSON.parse(configString);
      MosaicConfig.validateSchema(configObject);
      return configObject;
    }
    throw new InvalidMosaicConfigException(`blank config file found at: ${filePath}`);
  }

  /**
   * This method validate json object against mosaic config schema also throws an exception on failure.
   * @param jsonObject JSON object to be validated against schema.
   */
  private static validateSchema(jsonObject: any): void {
    const validator = new Validator();
    try {
      validator.validate(jsonObject, schema, { throwError: true });
    } catch (error) {
      throw new InvalidMosaicConfigException(error.message);
    }
  }
}
