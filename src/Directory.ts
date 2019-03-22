import * as path from 'path';
import * as os from 'os';

/**
 * Directory provides operations on strings representing directories.
 */
export default class Directory {
  /**
   * @returns The absolute path to the root of this project.
   */
  static get projectRoot(): string {
    return path.join(
      __dirname,
      '..'
    );
  }

  /**
   * Sanitizes given directory strings:
   * - replaces `~` at the beginning with the absolute path to the home directory.
   * - translates relative paths to absolute paths.
   * @param directory The directory string to sanitize.
   */
  static sanitize(directory: string): string {
    if (directory.substr(0, 1) === '~') {
      directory = path.join(os.homedir(), directory.substr(1));
    }

    // Relative directory name
    if (directory.substr(0, 1) !== '/') {
      directory = path.join(
        process.cwd(),
        directory,
      );
    }

    return directory;
  }
}
