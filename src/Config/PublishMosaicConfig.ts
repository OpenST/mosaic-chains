import * as path from 'path';
import Directory from '../Directory';
import FileSystem from '../FileSystem ';

/**
 * Publish Mosaic Config.
 */
export default class PublishMosaicConfig {
  /**
   * Copies the contents from chains/<originChain> directory to mosaic home
   * directory if it does not exists. This is called from all mosaic commands,
   * to ensure that the required files exists in the mosaic home directory.
   */
  public static tryPublish(originChain: string): void {
    const projectConfig = path.join(
      Directory.projectRoot,
      'chains',
      originChain,
      Directory.getMosaicFileName(),
    );

    if (FileSystem.existsSync(projectConfig)) {
      const configHomePath = path.join(
        Directory.getDefaultMosaicDataDir,
        originChain,
      );

      FileSystem.ensureDirSync(configHomePath);

      const mosaicConfig = path.join(
        configHomePath,
        Directory.getMosaicFileName(),
      );

      if (!FileSystem.existsSync(mosaicConfig)) {
        FileSystem.copySync(
          projectConfig,
          mosaicConfig,
        );
      }
    }
  }
}
