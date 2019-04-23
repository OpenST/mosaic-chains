import { spawnSync, execSync } from 'child_process';

/**
 * Executes shell commands in child processes.
 */
export default class Shell {
  /**
   * Executes a docker child process with the given arguments passed to docker.
   * @param args Arguments to the docker command.
   * @throws If the docker command returns an error.
   */
  public static executeDockerCommand(args: string[]): void {
    Shell.execute('docker', args);
  }

  /**
   * Executes a command in a child process and returns it.
   * The child process inherits stdio from this node process.
   * Inheriting stdio means that all input and output is piped to/from the spawned process.
   * For example, docker output is directly forwarded to stdout of the node process and
   * the attach command can accept input from the node process' stdin (terminal).
   * @param command The command to execute.
   * @param args The args to pass to the command.
   * @returns The child process that was spawned by this call.
   * @throws If the child process returns an error.
   */
  public static execute(command: string, args: string[]): void {
    // `stdio: 'inherit'` ensures that stdio of this process is inherited by the child process.
    const childProcess = spawnSync(command, args, { stdio: 'inherit' });
    if (childProcess.error instanceof Error) {
      throw childProcess.error;
    }
  }

  /**
   * Executes a command in child process and returns it.
   * It must be used when we need to utilize shell functionality such as pipe, redirects.
   * @param {string} command Command string to execute.
   * @returns Child process that was spawned by this call.
   */
  public static executeInShell(command: string): Buffer {
    return execSync(command);
  }
}
