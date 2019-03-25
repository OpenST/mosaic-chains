import * as fs from 'fs';
import * as path from 'path';
import Shell from '../Shell';
import Directory from '../Directory';
import Logger from '../Logger';

export default class AuxiliaryChain {
  private chainId: string;
  private mosaicDir: string;
  private chainDir: string;
  private password: string;

  constructor(chainId: string, mosaicDir: string, password: string) {
    this.chainId = chainId;
    this.mosaicDir = Directory.sanitize(mosaicDir);
    this.password = Directory.sanitize(password);

    this.chainDir = path.join(this.mosaicDir, this.chainId);
  }

  public generateAccounts(): void {
    if (fs.existsSync(path.join(this.chainDir, 'keystore'))) {
      Logger.info('keystore already exists; not re-generating addresses');
    } else {
      const args = [
        'run',
        '--rm',
        '--volume', `${this.chainDir}:/chain_data`,
        '--volume', `${this.password}:/password.txt`,
        'ethereum/client-go:v1.8.23',
        'account',
        'new',
        '--password', '/password.txt',
        '--datadir', './chain_data',
      ];

      Logger.info('generating auxiliary address for sealer');
      Shell.executeDockerCommand(args);

      Logger.info('generating auxiliary address for deployer');
      Shell.executeDockerCommand(args);
    }



    // TODO: return sealer and deployer addresses
  }
}
