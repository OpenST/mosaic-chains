import * as fs from 'fs-extra';
import { Validator } from 'jsonschema';
import MosaicConfig, { Address } from './MosaicConfig';
import {
  InvalidGatewayConfigException,
  GatewayConfigNotFoundException,
} from '../Exception';
import FileSystem from '../FileSystem ';
import Directory from '../Directory';
import Logger from '../Logger';

/* eslint-disable @typescript-eslint/no-var-requires */
const schema = require('./GatewayConfig.schema.json');

/**
 * Contract addresses of the origin chain specific to a gateway pair.
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
 * Contract addresses deployed on the auxiliary chain specific to a gateway pair.
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
 * Holds the config of a deployed gateway pair.
 */
export default class GatewayConfig {
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
   * @param filePath GatewayConfig absolute path.
   *
   * @return GatewayConfig object.
   */
  public static fromFile(filePath: string): GatewayConfig {
    if (GatewayConfig.exists(filePath)) {
      const configObject = GatewayConfig.readConfigFromFile(filePath);
      return new GatewayConfig(configObject);
    }
    throw new GatewayConfigNotFoundException(`Missing GatewayConfig file at path: ${filePath}`);
  }

  /**
   * Construct GatewayConfig object
   *
   * @param originChain Origin chain identifier.
   * @param auxChainId Auxiliary chain Id.
   * @param gatewayAddress Address of Gateway.
   *
   * @return gateway config
   */
  public static fromChain(originChain: string, auxChainId: number, gatewayAddress: string):
  GatewayConfig {
    const filePath = Directory.getGatewayConfigPath(originChain, auxChainId, gatewayAddress);
    Logger.info(`filepath for gateway config ${filePath}`);
    if (GatewayConfig.exists(filePath)) {
      const configObject = GatewayConfig.readConfigFromFile(filePath);
      return new GatewayConfig(configObject);
    }
    throw new GatewayConfigNotFoundException(`Missing GatewayConfig file at path: ${filePath}`);
  }

  /**
   * Read config from file, validate it and return as JSON object.
   *
   * @param filePath GatewayConfig absolute path.
   *
   * @return Json parsed object.
   */
  private static readConfigFromFile(filePath: string): object {
    const configString = fs.readFileSync(filePath).toString();
    if (configString && configString.length > 0) {
      const configObject = JSON.parse(configString);
      GatewayConfig.validateSchema(configObject);
      configObject.mosaicConfigFilePath = FileSystem.resolveHomePath(
        configObject.mosaicConfigFilePath,
      );
      return configObject;
    }
    throw new InvalidGatewayConfigException(`blank config file found at: ${filePath}`);
  }

  /**
   * This method validate json object against GatewayConfig schema.
   * Also throws an exception on failure.
   *
   * @param jsonObject JSON object to be validated against schema.
   */
  private static validateSchema(jsonObject: any): void {
    const validator = new Validator();
    try {
      validator.validate(jsonObject, schema, { throwError: true });
    } catch (error) {
      throw new InvalidGatewayConfigException(error.message);
    }
  }

  /**
   * Checks if GatewayConfig path exists or not.
   *
   * @param filePath GatewayConfig file path.
   *
   * @return True if file exists.
   */
  private static exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}
