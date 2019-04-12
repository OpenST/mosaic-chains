import * as fs from 'fs-extra';
import * as path from 'path';
import Web3 = require('web3');
import * as RLP from 'rlp';
import { ContractInteract } from '@openst/mosaic.js';

import CliqueGenesis from './CliqueGenesis';
import Contracts from './Contracts';
import Shell from '../Shell';
import Directory from '../Directory';
import Logger from '../Logger';
import NodeDescription from '../Node/NodeDescription';
import GethNode from '../Node/GethNode';
import { Tx } from 'web3/eth/types';
import InitConfig from '../Config/InitConfig';
import MosaicConfig from '../Config/MosaicConfig';
import Proof from './Proof';

/**
 * The new auxiliary chain that shall be created.
 */
export default class AuxiliaryChain {
  private web3: Web3;
  private chainDir: string;
  private sealer: string;
  private deployer: string;

  constructor(
    private initConfig: InitConfig,
    private chainId: string,
    private originChainId: string,
    private nodeDescription: NodeDescription,
  ) {
    this.chainDir = path.join(nodeDescription.mosaicDir, this.chainId);
  }

  /**
   * @returns The Web3 instance of this chain.
   */
  public getWeb3(): Web3 {
    return this.web3;
  }

  /**
   * @returns The chain id of this chain as gotten from the node.
   */
  public getChainId(): string {
    return this.chainId;
  }

  /**
   * Generates two new accounts with an ethereum node and adds the addresses to the mosaic config
   * as auxiliaryOriginalSealer and auxiliaryOriginalDeployer. These accounts will be used to run
   * the sealer and deploy the contracts on auxiliary.
   */
  public generateAccounts(mosaicConfig: MosaicConfig): MosaicConfig {
    if (fs.existsSync(path.join(this.chainDir, 'keystore'))) {
      this.logWarn(
        'keystore already exists; removing; has to start with fresh accounts to pre-calculate deployment addresses',
      );
      fs.removeSync(path.join(this.chainDir, 'keystore'));
    }
    this.logInfo('generating auxiliary address for sealer and deployer');

    const args = [
      'run',
      '--rm',
      '--volume', `${this.chainDir}:/chain_data`,
      '--volume', `${this.nodeDescription.password}:/password.txt`,
      'ethereum/client-go:v1.8.23',
      'account',
      'new',
      '--password', '/password.txt',
      '--datadir', '/chain_data',
    ];

    Shell.executeDockerCommand(args);
    Shell.executeDockerCommand(args);


    // It doesn't matter which account we assign which role as both accounts are new.
    [this.sealer, this.deployer] = this.getAccounts();
    mosaicConfig.auxiliaryOriginalSealer = this.sealer;
    mosaicConfig.auxiliaryOriginalDeployer = this.deployer;

    return mosaicConfig;
  }

  /**
   * Initializes a new chain from a new genesis.
   */
  public generateChain(): void {
    this.logInfo('generating a new auxiliary chain');
    this.generateGenesisFile();
    this.initFromGenesis();
    this.copyStateToChainsDir();
  }

  /**
   * Start a sealer node that runs the new auxiliary chain.
   */
  public async startSealer(): Promise<void> {
    this.logInfo('starting a sealer node');
    const bootKeyFile = this.generateBootKey();

    const unlockAccounts = [this.sealer, this.deployer];
    this.nodeDescription.unlock = unlockAccounts.join(',');

    const node = new GethNode(this.nodeDescription);
    // We always start a new chain with gas price zero.
    const gasPrice = '0';
    // 10 mio. as per `CliqueGenesis.ts`.
    const targetGasLimit = '10000000';
    node.startSealer(gasPrice, targetGasLimit, bootKeyFile);
    // The sealer runs locally on this machine and the port is published to the host from the
    // docker container.
    this.logInfo('waiting 5 seconds for the sealer port to become available');
    await AuxiliaryChain.sleep(5000);
    // Has to be RPC and not WS. WS connection was closed before deploying the Co-Gateway.
    // Reason unknown. Possibly due to the fact that according to `lsof` node keeps opening new
    // connections.
    this.web3 = new Web3(`http://127.0.0.1:${this.nodeDescription.rpcPort}`);
  }

  /**
   * @returns The state root at block height zero.
   */
  public getStateRootZero(): Promise<string> {
    return this.web3.eth.getBlock(0).then(
      (block) => {
        const stateRoot = block.stateRoot;
        this.logInfo('fetched state root zero', { blockHeight: 0, stateRoot });

        return stateRoot;
      }
    );
  }

  /**
   * Returns the address that the co-gateway will have once it will be deployed. The address is
   * pre-calculated and the co-gateway is not actually deployed.
   */
  public getExpectedOstCoGatewayAddress(auxiliaryDeployer: string): string {
    // This magic nonce results from the number of contracts that the deployer deploys on
    // auxiliary before it deploys the co-gateway. Nonces start at 0 and increase by 1 for each
    // deployed contract (transaction).
    const nonce = 7;
    // Forcing type `any`, as web3 sha3 otherwise complains that it only accepts strings.
    // `RLP.encode()` returns a `Buffer`.
    // However, converting the buffer to a string first yields the wrong result. The buffer has to
    // be passed directly into the sha3 function.
    const encoded: any = RLP.encode(
      [
        auxiliaryDeployer,
        nonce,
      ],
    );
    const nonceHash: string = this.web3.utils.sha3(encoded);
    // Remove leading `0x` and first 24 characters (12 bytes) of the hex
    // string leaving us with the remaining 40 characters (20 bytes) that
    // make up the address.
    const expectedOstCoGatewayAddress = this.web3.utils.toChecksumAddress(
      `0x${nonceHash.substring(26)}`
    );

    return expectedOstCoGatewayAddress;
  }

  /**
   * Deploys all the contracts that are required for a new auxiliary chain to be linked to origin.
   */
  public async deployContracts(
    mosaicConfig: MosaicConfig,
    originHeight: string,
    originStateRoot: string,
  ): Promise<MosaicConfig> {
    this.logInfo('deploying contracts');
    const anchorOrganization = await this.deployOrganization(
      this.initConfig.auxiliaryAnchorOrganizationOwner,
      this.initConfig.auxiliaryAnchorOrganizationAdmin,
    );
    mosaicConfig.auxiliaryAnchorOrganizationAddress = anchorOrganization.address;
    const anchor = await this.deployAnchor(
      this.originChainId,
      originHeight,
      originStateRoot,
      anchorOrganization.address,
    );
    mosaicConfig.auxiliaryAnchorAddress = anchor.address;
    const coGatewayAndOstPrimeOrganization = await this.deployOrganization(
      this.initConfig.auxiliaryCoGatewayAndOstPrimeOrganizationOwner,
      this.deployer,
    );
    mosaicConfig
      .auxiliaryCoGatewayAndOstPrimeOrganizationAddress = coGatewayAndOstPrimeOrganization.address;
    const ostPrime = await this.deployOstPrime(
      this.initConfig.originOstAddress,
      coGatewayAndOstPrimeOrganization.address,
    );
    mosaicConfig.auxiliaryOstPrimeAddress = ostPrime.address;
    const ostCoGateway = await this.deployOstCoGateway(
      this.initConfig.originOstAddress,
      ostPrime.address,
      anchor.address,
      coGatewayAndOstPrimeOrganization.address,
      mosaicConfig.originOstGatewayAddress,
    )
    mosaicConfig.auxiliaryOstCoGatewayAddress = ostCoGateway.address;

    this.logInfo('setting co-gateway on ost prime');
    await ostPrime.setCoGateway(ostCoGateway.address, this.txOptions);

    return mosaicConfig;
  }

  /**
   * Transfers all the base tokens of the new chain to the OST prime contract.
   */
  public async transferAllOstIntoOstPrime(mosaicConfig: MosaicConfig): Promise<void> {
    this.logInfo('initializing ost prime with all tokens');
    const ostPrime = new ContractInteract.OSTPrime(
      this.web3,
      mosaicConfig.auxiliaryOstPrimeAddress,
    );

    // 800 mio as per definition of OST.
    const value = '800000000000000000000000000';
    await ostPrime.initialize({
      ...this.txOptions,
      value,
    });
  }

  /**
   * Proves the gateway and the stake intent on the co-gateway.
   */
  public proveStake(
    mosaicConfig: MosaicConfig,
    hashLockSecret: string,
    proofData: Proof,
  ): Promise<void> {
    this.logInfo('proving stake');
    const hashLockHash = Web3.utils.sha3(hashLockSecret);
    const ostCoGateway = new ContractInteract.EIP20CoGateway(
      this.web3,
      mosaicConfig.auxiliaryOstCoGatewayAddress,
    );
    return ostCoGateway.proveGateway(
      proofData.blockNumber,
      proofData.accountData,
      proofData.accountProof,
      this.txOptions,
    ).then(() => {
      // Nonce is always one as it is always a new chain with a new gateway where this account has
      // not staked before.
      const nonce = '1';
      return ostCoGateway
        .confirmStakeIntent(
          this.initConfig.originTxOptions.from,
          nonce,
          mosaicConfig.auxiliaryOriginalDeployer,
          this.initConfig.originStakeAmount,
          this.initConfig.originStakeGasPrice,
          this.initConfig.originStakeGasLimit,
          hashLockHash,
          proofData.blockNumber,
          proofData.storageProof,
          this.txOptions,
        );
    });
  }

  /**
   * Progresses an already proven stake intent with the secret of the hash lock.
   */
  public async progressWithSecret(
    mosaicConfig: MosaicConfig,
    messageHash: string,
    hashLockSecret: string,
  ): Promise<void> {
    this.logInfo('progressing mint with secret');
    const ostCoGateway = new ContractInteract.EIP20CoGateway(
      this.web3,
      mosaicConfig.auxiliaryOstCoGatewayAddress,
    );
    return ostCoGateway.progressMint(messageHash, hashLockSecret, this.txOptions)
  }

  /**
   * @returns The transaction options to use for transactions to the auxiliary chain.
   */
  private get txOptions(): Tx {
    return {
      from: this.deployer,
      gasPrice: '0',
      // This can be any arbitrarily high number as the gas price is zero and we do not want the
      // transaction to be limited by the gas allowance.
      gas: '10000000',
    }
  }

  /**
   * Creates a new genesis file for this chain and stores it in the chain data directory.
   */
  private generateGenesisFile(): void {
    this.logInfo('generating and writing genesis.json to chain directory');
    const genesis = CliqueGenesis.create(this.chainId, this.sealer, this.deployer);

    fs.writeFileSync(
      path.join(this.chainDir, 'genesis.json'),
      JSON.stringify(
        genesis,
        null,
        '  ',
      ),
    );
  }

  /**
   * Initializes a new auxiliary chain from a stored genesis in the chain data directory.
   */
  private initFromGenesis(): void {
    this.logInfo('initializing chain from genesis');
    const args = [
      'run',
      '--rm',
      '--volume', `${this.chainDir}:/chain_data`,
      'ethereum/client-go:v1.8.23',
      '--datadir', '/chain_data',
      'init',
      '/chain_data/genesis.json'
    ];

    Shell.executeDockerCommand(args);
  }

  /**
   * Copies the chain data from the mosaic directory into this project to be committed for others
   * to connect.
   */
  private copyStateToChainsDir(): void {
    fs.ensureDirSync(Directory.getProjectUtilityChainDir(this.chainId));

    this.copy('geth');
    this.copy('genesis.json');
  }

  /**
   * Copies the given file from the chain data directory to the project utility chain sub-directory.
   */
  private copy(file: string): void {
    const source: string = path.join(this.chainDir, file);
    const destination: string = path.join(
      Directory.getProjectUtilityChainDir(this.chainId),
      file,
    );
    this.logInfo('copying chains state to utility chains directory', { source, destination });
    try {
      fs.copySync(
        source,
        destination,
      );
    } catch (error) {
      this.logError('could not copy', { source, destination, error: error.toString() });
      throw error;
    }
  }

  /**
   * Reads the sealer and deployer addresses from the keystore.
   * @returns Both addresses with leading `0x`.
   */
  private getAccounts(): string[] {
    this.logInfo('reading sealer and deployer address from disk');
    const addresses: string[] = this.readAddressesFromKeystore();
    if (addresses.length !== 2) {
      const message: string = 'did not find exactly two addresses in auxiliary keystore; aborting';
      Logger.error(message);
      throw new Error(message);
    }

    return addresses.map(address => `0x${address}`);
  }

  /**
   * Generates a new boot key and stores it in the chain data directory.
   */
  private generateBootKey(): string {
    this.logInfo('generating boot key');
    const bootKeyFile = 'boot.key';

    const args = [
      'run',
      '--rm',
      '--volume', `${this.chainDir}:/chain_data`,
      'ethereum/client-go:alltools-v1.8.23',
      'bootnode',
      '--genkey', `/chain_data/${bootKeyFile}`,
    ];
    Shell.executeDockerCommand(args);

    return bootKeyFile;
  }

  /**
   * @returns The raw addresses from the key store, without leading `0x`.
   */
  private readAddressesFromKeystore(): string[] {
    this.logInfo('reading addresses from keystore');
    const addresses: string[] = [];

    const filesInKeystore: string[] = fs.readdirSync(path.join(this.chainDir, 'keystore'));
    for (const file of filesInKeystore) {
      const fileContent = JSON.parse(
        fs.readFileSync(
          path.join(
            this.chainDir,
            'keystore',
            file,
          ),
          { encoding: 'utf8' },
        ),
      );
      if (fileContent.address !== undefined) {
        addresses.push(fileContent.address);
      }
    }

    return addresses;
  }

  /**
   * Deploys an organization.
   */
  private deployOrganization(owner: string, admin: string): Promise<ContractInteract.Organization> {
    this.logInfo('deploying organization', { owner, admin });
    return Contracts.deployOrganization(this.web3, this.txOptions, owner, admin);
  }

  /**
   * Deploys an anchor.
   */
  private deployAnchor(
    originChainId: string,
    initialHeight: string,
    initialStateRoot: string,
    organizationAddress: string,
  ): Promise<ContractInteract.Anchor> {
    this.logInfo(
      'deploying anchor',
      { originChainId, initialHeight, initialStateRoot, organizationAddress },
    );
    return Contracts.deployAnchor(
      this.web3,
      this.txOptions,
      originChainId,
      initialHeight,
      initialStateRoot,
      this.initConfig.auxiliaryAnchorBufferSize,
      organizationAddress,
    );
  }

  /**
   * Deploys OST prime.
   */
  private deployOstPrime(
    ostAddress: string,
    organizationAddress: string,
  ): Promise<ContractInteract.OSTPrime> {
    this.logInfo('deploying ost prime', { ostAddress, organizationAddress });
    const ostPrime = Contracts.deployOstPrime(
      this.web3,
      this.txOptions,
      ostAddress,
      organizationAddress,
    );
    return ostPrime;
  }

  /**
   * Deploys an OST co-gateway.
   */
  private deployOstCoGateway(
    ostAddress: string,
    ostPrimeAddress: string,
    anchorAddress: string,
    organizationAddress: string,
    gatewayAddress: string,
  ): Promise<ContractInteract.OSTPrime> {
    this.logInfo(
      'deploying ost co-gateway',
      { ostAddress, ostPrimeAddress, anchorAddress, organizationAddress, gatewayAddress },
    );
    const ostPrime = Contracts.deployOstCoGateway(
      this.web3,
      this.txOptions,
      ostAddress,
      ostPrimeAddress,
      anchorAddress,
      this.initConfig.auxiliaryBounty,
      organizationAddress,
      gatewayAddress,
      this.initConfig.auxiliaryBurnerAddress,
    );
    return ostPrime;
  }

  /**
   * Logs the given message and meta data as log level info.
   */
  private logInfo(message: string, metaData: any = {}): void {
    Logger.info(message, { chain: 'auxiliary', chainId: this.chainId, ...metaData });
  }

  /**
   * Logs the given message and meta data as log level warn.
   */
  private logWarn(message: string, metaData: any = {}): void {
    Logger.warn(message, { chain: 'auxiliary', chainId: this.chainId, ...metaData });
  }

  /**
   * Logs the given message and meta data as log level error.
   */
  private logError(message: string, metaData: any = {}): void {
    Logger.error(message, { chain: 'auxiliary', chainId: this.chainId, ...metaData });
  }

  /**
   * @returns A promise that resolves after the given number of milliseconds.
   */
  private static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
