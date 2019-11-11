import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import Shell from '../../src/Shell';
import Directory from '../../src/Directory';
import DEV_CHAIN_DOCKER from '../../src/Node/GethNode';

const waitPort = require('wait-port');

export default class Utils {
  /**
   * This Method starts origin dev chain at given port.
   * @param web3Port Port where origin chain will start.
   */
  public static startOriginChain(
    web3Port: number,
  ): Promise<ChildProcess> {
    return new Promise(async (resolve, reject) => {
      const startOriginChainArgs = [
        'run',
        '-p',
        `${web3Port}:8545`,
        '-p',
        '8546:8546',
        '--name',
        'integration_test_origin',
        DEV_CHAIN_DOCKER,
        'origin',
      ];
      const originNodeDockerProcess = spawn('docker', startOriginChainArgs, { stdio: 'inherit' });
      const waitForWebsocketPort = await waitPort({
        port: web3Port,
        output: 'silent',
      });
      await waitForWebsocketPort;
      await setTimeout(
        () => resolve(originNodeDockerProcess),
        // even after the ports are available the nodes need a bit of time to get online
        30000,
      );
    });
  }

  /**
   * This method stops origin chain.
   */
  public static stopOriginChain() {
    Shell.executeInShell('docker stop integration_test_origin');
    Shell.executeInShell('docker rm integration_test_origin');
  }

  /**
   * This methods cleans directory after tests are complete.
   * @param originChain Origin chain identifier.
   */
  public static cleanDirectories(originChain: string) {
    const originDirectory = path.join(
      Directory.getDefaultMosaicDataDir,
      originChain,
    );

    fs.removeSync(originDirectory);

    const originChainProjectDirectory = path.join(
      Directory.projectRoot,
      'chains',
      originChain,
    );
    fs.removeSync(originChainProjectDirectory);
  }
}
