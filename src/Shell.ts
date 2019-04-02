import { spawn, ChildProcess, exec } from 'child_process';

/**
 * Executes shell commands in child processes.
 */
export default class Shell {
  /**
   * Executes a docker child process with the given arguments passed to docker.
   * @param args Arguments to the docker command.
   */
  public static executeDockerCommand(args: string[]): ChildProcess {
    const childProcess: ChildProcess = Shell.execute('docker', args);

    return childProcess;
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
   */
  public static execute(command: string, args: string[]): ChildProcess {
    // `stdio: 'inherit'` ensures that stdio of this process is inherited by the child process.
    return spawn(command, args, { stdio: 'inherit' });
  }

    /**
     * Executes a command in child process and returns it.
     * It must be used when we need to utilize shell functionality such as pipe, redirects.
     * @param {string} command Command string to execute.
     * @returns Child process that was spawned by this call.
     */
  public static executeCommand(command: string): ChildProcess {
    return exec(command);
  }
}
