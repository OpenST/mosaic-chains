import * as fs from 'fs-extra';
import { Validator } from 'jsonschema';
import MosaicConfig, { Address } from './MosaicConfig';
import {
  InvalidTokenConfigException,
  TokenConfigNotFoundException,
} from '../Exception';
import FileSystem from '../FileSystem ';
import Directory from '../Directory';

/* eslint-disable @typescript-eslint/no-var-requires */
const schema = require('./TokenConfig.schema.json');

/**
 * Contract addresses of the origin chain specific to a token.
 */
export class OriginContracts {
  public baseTokenAddress: Address;

  public valueTokenAddress: Address;

  public gatewayOrganizationAddress: Address;

  public eip20GatewayAddress: Address;

  public gatewayLibAddress?: Address;

  public messageBusAddress?: Address;

  public merklePatriciaLibAddress?: Address;

  public stakePoolAddress?: Address;
}

/**
 * Contract addresses deployed on the auxiliary chain specific to a token.
 */
export class AuxiliaryContracts {
  public coGatewayOrganizationAddress: Address;

  public utilityTokenAddress: Address;

  public eip20CoGatewayAddress: Address;

  public gatewayLibAddress?: Address;

  public messageBusAddress?: Address;

  public merklePatriciaLibAddress?: Address;

  public redeemPoolAddress?: Address;
}

/**
 * Holds the config of a deployed token.
 */
export default class TokenConfig {
  public mosaicConfig: MosaicConfig;

  public auxChainId: number;

  public originContracts: OriginContracts;

  public auxiliaryContracts: AuxiliaryContracts;

  private constructor(config: any) {
    this.mosaicConfig = MosaicConfig.fromFile(config.mosaicConfigFilePath);
    this.auxChainId = config.auxChainId;
    this.originContracts = config.originContracts;
    this.auxiliaryContracts = config.auxiliaryContracts;
  }

  /**
   * @param filePath tokenConfig absolute path.
   *
   * @return TokenConfig object.
   */
  public static fromFile(filePath: string): TokenConfig {
    if (fs.existsSync(filePath)) {
      const configObject = TokenConfig.readConfigFromFile(filePath);
      return new TokenConfig(configObject);
    }
    throw new TokenConfigNotFoundException(`Missing token config file at path: ${filePath}`);
  }

  /**
   * Construct TokenConfig object
   *
   * @param originChain Origin chain identifier.
   * @param auxChainId Auxiliary chain Id.
   * @param gatewayAddress Address of Gateway.
   *
   * @return mosaic config
   */
  public static fromChain(originChain: string, auxChainId: number, gatewayAddress: string):
  TokenConfig {
    let filePath;
    if (TokenConfig.exists(originChain, auxChainId, gatewayAddress)) {
      filePath = Directory.getTokenConfigPath(originChain, auxChainId, gatewayAddress);
      console.log('File path:', filePath);
      const configObject = TokenConfig.readConfigFromFile(filePath);
      return new TokenConfig(configObject);
    }
    throw new TokenConfigNotFoundException(`Missing token config file at path: ${filePath}`);
  }

  /**
   * Read config from file, validate it and return as JSON object.
   *
   * @param filePath tokenConfig absolute path.
   *
   * @return Json parsed object.
   */
  private static readConfigFromFile(filePath: string): object {
    const configString = fs.readFileSync(filePath).toString();
    if (configString && configString.length > 0) {
      const configObject = JSON.parse(configString);
      TokenConfig.validateSchema(configObject);
      configObject.mosaicConfigFilePath = FileSystem.resolveHomePath(
        configObject.mosaicConfigFilePath,
      );
      return configObject;
    }
    throw new InvalidTokenConfigException(`blank config file found at: ${filePath}`);
  }

  /**
   * This method validate json object against token config schema.
   * Also throws an exception on failure.
   *
   * @param jsonObject JSON object to be validated against schema.
   */
  private static validateSchema(jsonObject: any): void {
    const validator = new Validator();
    try {
      validator.validate(jsonObject, schema, { throwError: true });
    } catch (error) {
      throw new InvalidTokenConfigException(error.message);
    }
  }

  /**
   * Checks if token config exists for a origin chain.
   *
   * @param originChain Origin chain identifier.
   * @param auxChainId Auxiliary chain Id.
   * @param gatewayAddress Address of Gateway.
   *
   * @return True if file exists.
   */
  public static exists(originChain: string, auxChainId: number, gatewayAddress: string): boolean {
    const filePath = Directory.getTokenConfigPath(originChain, auxChainId, gatewayAddress);
    return fs.existsSync(filePath);
  }
}