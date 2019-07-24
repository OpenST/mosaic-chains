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
    const projectMosaicConfigPath = Directory.getProjectMosaicConfigPath(originChain);

    if (FileSystem.existsSync(projectMosaicConfigPath)) {
      const mosaicConfigHomePath = Directory.getMosaicConfigHomePath(originChain);
      FileSystem.ensureDirSync(mosaicConfigHomePath);

      const mosaicConfig = Directory.getMosaicConfigPath(originChain);

      if (!FileSystem.existsSync(mosaicConfig)) {
        const projectMosaicConfigHomePath = Directory.getProjectMosaicConfigHomePath(originChain);
        FileSystem.copySync(
          projectMosaicConfigHomePath,
          mosaicConfigHomePath,
        );
      }
    }
  }
}
