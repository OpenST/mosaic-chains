import * as path from 'path';
import * as os from 'os';

const MOSAIC_CONFIG_FILE = 'mosaic.json';
/**
 * Directory provides operations on strings representing directories.
 */
export default class Directory {
  /**
   * @returns The absolute path to the directory in which we store mosaic data.
   */
  public static get getDefaultMosaicDataDir(): string {
    return path.join(
      os.homedir(),
      '.mosaic',
    );
  }

  /**
   * @returns The absolute path to the root of this project.
   */
  public static get projectRoot(): string {
    return path.join(
      __dirname,
      '..',
    );
  }

  /**
   * @param originChain The origin chain identifier.
   * @param auxiliaryChainId The auxiliary chain id of the chain.
   * @returns The absolute path to the directory of the given utility chain.
   * @throws If `auxiliaryChainId` or `originChain` is an empty string.
   */
  public static getProjectUtilityChainDir(
    originChain: string,
    auxiliaryChainId: string,
  ): string {
    if (originChain === undefined || originChain.length === 0) {
      throw new Error('Origin chain identifier cannot be empty in order to get its directory');
    }
    if (auxiliaryChainId === undefined || auxiliaryChainId.length === 0) {
      throw new Error('Auxiliary chain id cannot be empty in order to get its directory');
    }

    return path.join(
      Directory.projectRoot,
      'chains',
      originChain,
      auxiliaryChainId,
    );
  }

  /**
   * @returns The absolute path to the directory of the Graph code.
   */
  public static getProjectGraphDir(): string {
    return path.join(
      Directory.projectRoot,
      'src',
      'Graph',
    );
  }

  /**
   * @param {string} subGraphType
   * @returns The absolute path to the directory of the auto generated Graph code.
   */
  public static getProjectAutoGenGraphDir(subGraphType: string): string {
    return path.join(
      Directory.projectRoot,
      'graph',
      subGraphType,
    );
  }

  /**
   *
   * @param {string} originChain
   * @param {string} auxiliaryChain
   * @return {string}
   */
  public static getOriginSubGraphProjectDirSuffix(
    originChain: string,
    auxiliaryChain: string,
  ): string {
    return path.join(
      originChain,
      'origin',
      'subgraph',
      auxiliaryChain,
    );
  }

  /**
   * @param originChain Origin chain.
   * @param auxiliaryChain auxiliary chain id.
   * @return path
   */
  public static getAuxiliarySubGraphProjectDirSuffix(
    originChain: string,
    auxiliaryChain: string,
  ): string {
    return path.join(
      originChain,
      auxiliaryChain,
      'subgraph',
      auxiliaryChain,
    );
  }

  /**
   * @returns The absolute path to the directory where we copy code temporarily to deploy graph.
   */
  public static get getTempGraphInstallationDir(): string {
    return path.join(
      Directory.getDefaultMosaicDataDir,
      'temp',
    );
  }

  /**
   * Sanitizes given directory strings:
   * - replaces `~` at the beginning with the absolute path to the home directory.
   * - translates relative paths to absolute paths.
   * @param directory The directory string to sanitize.
   */
  public static sanitize(directory: string): string {
    let sanitized: string = directory;

    if (sanitized.substr(0, 1) === '~') {
      sanitized = path.join(os.homedir(), sanitized.substr(1));
    }

    // Relative directory name
    if (sanitized.substr(0, 1) !== '/') {
      sanitized = path.join(
        process.cwd(),
        sanitized,
      );
    }

    return sanitized;
  }

  /**
   * Returns the mosaic json file name.
   */
  public static getMosaicFileName(): string {
    return MOSAIC_CONFIG_FILE;
  }

  /**
   * Returns the full path of mosaic config for a given origin chain.
   * @param originChain Origin Chain Identifier
   * @return Path of mosaic config file.
   */
  public static getMosaicConfigPath(originChain: string): string {
    return path.join(
      Directory.getDefaultMosaicDataDir,
      originChain,
      Directory.getMosaicFileName(),
    );
  }
}
