import * as fs from 'fs';
import * as path from 'path';
import Directory from '../Directory';
import MosaicConfig from "./MosaicConfig";

/**
 * Factory class which would return an instance of MosaicConfig.
 */
export default class MosaicConfigFactory {

  /**
   * @param {string} chain
   * @return {MosaicConfig}
   */
  public static from(chain: string): MosaicConfig {
    const publishMosaicConfigDir = Directory.getPublishMosaicConfigDir;
    const filePath = path.join(
      publishMosaicConfigDir,
      `${chain}.json`,
    );
    if (fs.existsSync(filePath)) {
      return new MosaicConfig(MosaicConfigFactory.readConfigFromFile(filePath));
    } else {
      return new MosaicConfig({} as any);
    }
  }

  /**
   * read config from file, validate it and return as JSON object
   * @param {string} filePath
   * @return {object}
   */
  public static readConfigFromFile(filePath: string): object {
    const configString = fs.readFileSync(filePath).toString();
    if (configString && configString.length > 0) {
      const configObject = JSON.parse(configString);
      MosaicConfig.validateSchema(configObject);
      return configObject;
    }
  }

}
