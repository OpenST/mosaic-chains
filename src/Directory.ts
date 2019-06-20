import * as path from 'path';
import * as os from 'os';

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
   * @returns The absolute path to the directory in which we publish mosaic configs.
   */
  public static get getPublishMosaicConfigDir(): string {
    return path.join(
      Directory.getDefaultMosaicDataDir,
      'configs',
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
   * @returns The absolute path to the utility chains directory in the project.
   */
  public static get projectUtilityChainsDir(): string {
    return path.join(
      Directory.projectRoot,
      'utility_chains',
    );
  }

  /**
   * @param chainId The chain id of the chain.
   * @returns The absolute path to the directory of the given utility chain.
   * @throws If `chainId` is an empty string.
   */
  public static getProjectUtilityChainDir(chainId: string): string {
    if (chainId === '') {
      throw new Error('a chain id cannot be empty in order to get its directory');
    }

    return path.join(
      Directory.projectUtilityChainsDir,
      `utility_chain_${chainId}`,
    );
  }

  /**
   * @returns The absolute path to the directory of the code base where we keep mosaic config of existing chains.
   */
  public static get getProjectMosaicConfigDir(): string {
    return path.join(
      Directory.projectRoot,
      'mosaic_configs',
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
  public static getOriginSubGraphProjectDirSuffix(originChain: string, auxiliaryChain: string): string {
    return path.join(
      originChain,
      'subgraph',
      auxiliaryChain,
    );
  }

  /**
   * @param {string} auxiliaryChain
   * @return {string}
   */
  public static getAuxiliarySubGraphProjectDirSuffix(auxiliaryChain: string): string {
    return path.join(
      auxiliaryChain,
      'subgraph',
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
}
