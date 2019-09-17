import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import Shell from '../../src/Shell';
import Directory from '../../src/Directory';

const waitPort = require('wait-port');

export default class Utils {
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
        'mosaicdao/dev-chains',
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

  public static stopOriginChain() {
    Shell.executeInShell('docker stop integration_test_origin');
    Shell.executeInShell('docker rm integration_test_origin');
  }

  public static cleanDirectories(originChain: string) {
    const originDirectory = path.join(
      Directory.getDefaultMosaicDataDir,
      originChain,
    );

    console.log(originDirectory);
    fs.removeSync(originDirectory);

    const originChainProjectDirectory = path.join(
      Directory.projectRoot,
      'chains',
      originChain,
    );
    console.log(originChainProjectDirectory);
    fs.removeSync(originChainProjectDirectory);
  }
}
