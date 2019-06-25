import * as path from 'path';
import Directory from '../Directory';
import FileSystem from '../FileSystem ';

/**
 * Publish Mosaic Config.
 */
export default class PublishMosaicConfig {
  /**
   * copy over all the non existent files to publish folder
   */
  public static tryPublish(originChain: string): void {

    const configHomePath = path.join(
      Directory.getDefaultMosaicDataDir,
      originChain,
    );

    FileSystem.ensureDirSync(configHomePath);

    const mosaicConfig = path.join(
      configHomePath,
      'mosaic.json',
    );

    if (FileSystem.existsSync(mosaicConfig) === false) {
      const projectConfig = path.join(
        Directory.projectRoot,
        originChain,
        'mosaic.json',
      );

      FileSystem.copySync(
        mosaicConfig,
        projectConfig,
      );
    }
  }
}
