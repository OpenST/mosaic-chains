import * as fs from 'fs-extra';
import * as path from 'path';
import Directory from '../Directory';

/**
 * Publish Mosaic Config.
 */
export default class PublishMosaicConfig {

  /**
   * copy over all the non existent files to publish folder
   */
  public static publish(): void {
    const publishMosaicConfigDir = Directory.getPublishMosaicConfigDir;
    const publishedFileNames: Array<string> = fs.readdirSync(publishMosaicConfigDir);
    const publishedFileNamesMap = {};
    for (let publishedFileName of publishedFileNames) {
      publishedFileNamesMap[publishedFileName] = 1;
    }
    const projectMosaicConfigDir = Directory.getProjectMosaicConfigDir;
    const toBePublishedFileNames: Array<string> = fs.readdirSync(projectMosaicConfigDir);
    for (let toBePublishedFileName of toBePublishedFileNames) {
      if (!publishedFileNamesMap.hasOwnProperty(toBePublishedFileName)) {
        fs.copySync(
          path.join(projectMosaicConfigDir, toBePublishedFileName),
          path.join(publishMosaicConfigDir, toBePublishedFileName)
        );
      }
    }
  }

}