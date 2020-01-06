import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import Node from './Node';
import Shell from '../Shell';
import Logger from '../Logger';
import CliqueParityGenesis from '../NewChain/Genesis/Clique/Parity';
import Utils from '../Utils';

import Web3 = require('web3');

const waitPort = require('wait-port');

const PARITY_VERSION = 'v2.5.11-stable';
const PARITY_DOCKER_DIR = '/home/parity/.local/share/io.parity.ethereum';
const PARITY_DOCKER_GENESIS_FILE = '/home/parity/parity.json';

/**
 * Represents a parity node that runs in a docker container.
 */
export default class ParityNode extends Node {
  /**
   * generates accounts
   */
  public generateAccounts(count: number): string[] {
    this.logInfo('generating addresses for parity node in keys folder');
    let args = [
      'docker',
      'run',
      '--rm',
      '--volume', `${this.chainDir}:${PARITY_DOCKER_DIR}`,
      '--volume', `${this.password}:/password.txt`,
    ];

    args = args.concat(this.genesisParityArgs());
    args = args.concat(ParityNode.userParityArgs());

    args = args.concat([
      `parity/parity:${PARITY_VERSION}`,
      'account',
      'new',
      '--password', '/password.txt',
      '--base-path', PARITY_DOCKER_DIR,
      '--chain', PARITY_DOCKER_GENESIS_FILE,
    ]);

    const addresses: string[] = [];
    // The command is executed count number of times. Each time the command is run,
    // it creates one new account. This is also the reason why the password file must contain the
    // same password count number of times, once per line. All accounts get created with the password on the first
    // line of the file, but all of them are read for unlocking when the node is later started.
    for (let i = 1; i <= count; i++) {
      // as we need the response which holds the address generated, using executeInShell
      const addrGenerationResponseBuffer = Shell.executeInShell(args.join(' '));
      addresses.push(addrGenerationResponseBuffer.toString().trim());
    }
    return addresses;
  }

  /**
   * returns path to folder where keystore files are written to disk
   */
  public get keysFolder(): string {
    return path.join(this.chainDir, 'keys', this.chain);
  }

  /**
   * returns genesis file name
   */
  public get genesisFileName(): string {
    return 'parity.json';
  }

  public async startSealer(sealer: string): Promise<void> {
    this.logInfo('starting parity sealer');
    this.performStartPrequisites();
    let args = this.defaultParityArgs();
    args = args.concat([
      '--engine-signer', sealer,
      '--min-gas-price', '0',
      '--force-sealing',
    ]);
    Shell.executeDockerCommand(args);
    const waitForWebsocketPort = waitPort({ port: this.rpcPort, output: 'silent' });
    const waitForRpcAdminPort = waitPort({ port: this.websocketPort, output: 'silent' });
    await Promise.all([
      waitForWebsocketPort,
      waitForRpcAdminPort,
    ]).then(() => new Promise((resolve, reject) => {
      // even after the ports are available the nodes need a bit of time to get online
      setTimeout(resolve, 10000);
    }));
  }

  /**
   * Starts the container that runs this chain node.
   */
  public start(): void {
    this.logInfo('starting parity container');
    this.performStartPrequisites();
    const args = this.defaultParityArgs();
    Shell.executeDockerCommand(args);
  }

  /**
   *  This returns boot node of the auxiliary chain.
   */
  public getBootNode(): string {
    const command = `curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"parity_enode","params":[],"id":1}' ${Utils.ipAddress()}:${this.rpcPort}`;
    const enodeResponseString = Shell.executeInShell(command);
    const enodeResponseJson = JSON.parse(enodeResponseString.toString());
    const enode = enodeResponseJson.result;
    const matchResult = enode.match(/enode:\/\/(\w*)@*/);
    return matchResult[1];
  }

  /**
   * Generates genesis file data
   */
  public generateGenesisFile(chainId: string): any {
    return CliqueParityGenesis.create(chainId);
  }

  /**
   * Appends blocks specific to generated addresses to existing genesis data
   */
  public appendAddressesToGenesisFile(genesis: any, sealer: string, deployer: string): any {
    return CliqueParityGenesis.appendAddresses(genesis, sealer, deployer);
  }

  /**
   * Initializes a new auxiliary chain from a stored genesis in the chain data directory.
   */
  public initFromGenesis(): void {
    // do nothing here as init is not required in parity
  }

  /**
   * It polls every 4-secs to fetch the list of wallets.
   * It logs error when connection is not established even after max tries.
   */
  public async verifyAccountsUnlocking(web3: Web3): Promise<void> {
    // do nothing here as it is not supported in parity
  }

  /**
   * Perform steps which are prerequisite for starting a parity node.
   */
  private performStartPrequisites(): void{
    super.initializeDirectories();
    super.ensureNetworkExists();
  }

  /**
   * returns default args for starting a parity node.
   */
  private defaultParityArgs(): string[] {
    let args = [
      'run',
    ];

    if (!this.keepAfterStop) {
      args = args.concat('--rm');
    }

    args = args.concat([
      '--network', Node.network,
      '--detach',
      '--name', this.containerName,
      '--publish', `${this.port}:${this.port}`,
      '--publish', `${this.rpcPort}:8545`,
      '--publish', `${this.websocketPort}:8546`,
      '--volume', `${this.chainDir}:${PARITY_DOCKER_DIR}`,
    ]);

    if (this.originChain) {
      args = args.concat(this.genesisParityArgs());
    }

    args = args.concat(ParityNode.userParityArgs());

    if (this.password !== '') {
      args = args.concat([
        '--volume', `${this.password}:/home/parity/password.txt`,
      ]);
    }

    args = args.concat([
      `parity/parity:${PARITY_VERSION}`,
      `--base-path=${PARITY_DOCKER_DIR}`,
      `--port=${this.port}`,
      '--jsonrpc-port=8545',
      '--jsonrpc-apis=all',
      '--jsonrpc-interface=all',
      '--jsonrpc-experimental',
      '--ws-port=8546',
      '--ws-interface=all',
      '--ws-apis=all',
      '--ws-origins=all',
      '--ws-hosts=all',
    ]);

    const chainParam = this.originChain ? PARITY_DOCKER_GENESIS_FILE : this.chain;
    args = args.concat([
      `--chain=${chainParam}`,
    ]);

    if (this.unlock !== '') {
      args = args.concat([
        '--unlock', this.unlock,
        '--password', '/home/parity/password.txt',
      ]);
    }

    return args;
  }

  /**
   * returns argument for mounting parity genesis.
   */
  private genesisParityArgs(): string[] {
    return [
      '--volume', `${super.genesisProjectFilePath()}:${PARITY_DOCKER_GENESIS_FILE}`,
    ];
  }

  /**
   * returns argument for user details with which parity docker commands should run
   */
  private static userParityArgs(): string[] {
    const userInfo = os.userInfo();
    // Running the parity process inside the container as the same user id that is executing this
    // script. This is required, because otherwise the parity process will not be able to write to the
    // mounted directory. The parity process inside the container is not run as root (as usual),
    // but instead runs with uid/guid 1000/1000 by default. This option overrides that default
    // behavior so that the parity process can write to its mounted chain directory in all
    // environments. This was introduced after failing tests on Travis CI.
    return [
      '--user', `${userInfo.uid}:${userInfo.gid}`,
    ];
  }

}
