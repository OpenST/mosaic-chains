import * as fs from 'fs';
import * as path from 'path';
import Web3 = require('web3');
import { Utils } from '@openst/mosaic.js';

import InitConfig from '../Config/InitConfig';
import MosaicConfig from '../Config/MosaicConfig';
import OriginChain from './OriginChain';
import AuxiliaryChain from './AuxiliaryChain';
import NodeDescription from '../Node/NodeDescription';
import Logger from '../Logger';
import Proof from './Proof';
import Directory from '../Directory';

/**
 * Initialization stitches together all classes and steps to create a new auxiliary chain.
 */
export default class Initialization {
  /**
   * Initialize initializes a new auxiliary chain.
   * @param newChainId The chain id of the new chain to create.
   * @param originWebsocket A websocket string that points at an existing, unlocked origin node.
   * @param auxiliaryNodeDescription Settings for the new auxiliary container that will run the new
   *     chain.
   */
  public static async initialize(
    newChainId: string,
    originWebsocket: string,
    auxiliaryNodeDescription: NodeDescription,
  ) {
    const initConfig: InitConfig = InitConfig.createFromFile(newChainId);
    if (!initConfig.isValid()) {
      throw new Error('no valid configuration found');
    }

    if (!Initialization.environmentIsClean(auxiliaryNodeDescription)) {
      throw new Error('chain dir exists; it must be empty to generate a new chain');
    }

    const originWeb3: Web3 = new Web3(originWebsocket);
    const hashLockSecret: string = Web3.utils.randomHex(32);

    const originChain: OriginChain = new OriginChain(initConfig, originWeb3, newChainId);
    const originChainId: string = await originChain.getChainId();

    const auxiliaryChain: AuxiliaryChain = new AuxiliaryChain(
      initConfig,
      newChainId,
      originChainId,
      auxiliaryNodeDescription,
    );

    const mosaicConfig = new MosaicConfig();
    mosaicConfig.originChainId = originChainId;

    await Initialization.createAuxiliaryChain(
      auxiliaryNodeDescription,
      mosaicConfig,
      originChain,
      auxiliaryChain,
      hashLockSecret,
    );
  }

  /**
   * Verifies that the current host environment is not blocking initialization of a new chain.
   */
  private static environmentIsClean(nodeDescription: NodeDescription): boolean {
    const chainDir = path.join(nodeDescription.mosaicDir, nodeDescription.chainId);
    if (fs.existsSync(chainDir)) {
      Logger.error('chain dir exists; it must be empty to generate a new chain', { chainDir });
      return false;
    }

    return true;
  }

  /**
   * Creates a new auxiliary chain from a new genesis with a new container.
   */
  private static async createAuxiliaryChain(
    auxiliaryNodeDescription: NodeDescription,
    mosaicConfig: MosaicConfig,
    originChain: OriginChain,
    auxiliaryChain: AuxiliaryChain,
    hashLockSecret: string,
  ): Promise<void> {
    Initialization.initializeDataDir(auxiliaryNodeDescription.mosaicDir);
    mosaicConfig.auxiliaryChainId = auxiliaryNodeDescription.chainId;

    [mosaicConfig, auxiliaryChain] = await Initialization.startAuxiliary(
      mosaicConfig,
      auxiliaryChain,
    );

    const auxiliaryStateRootZero: string = await auxiliaryChain.getStateRootZero();
    const expectedOstCoGatewayAddress: string = auxiliaryChain.getExpectedOstCoGatewayAddress(
      mosaicConfig.auxiliaryOriginalDeployer
    );

    mosaicConfig = await originChain.deployContracts(
      mosaicConfig,
      auxiliaryStateRootZero,
      expectedOstCoGatewayAddress,
    );

    const {
      originBlockNumber,
      originStateRoot,
      originMessageHash,
      proofData,
    } = await Initialization.initializeOrigin(mosaicConfig, originChain, auxiliaryChain, hashLockSecret);

    mosaicConfig = await Initialization.finalizeAuxiliary(
      mosaicConfig,
      auxiliaryChain,
      originBlockNumber,
      originStateRoot,
      hashLockSecret,
      proofData,
    );

    // Progressing on both chains in parallel (with hash lock secret).
    await Promise.all([
      originChain.progressWithSecret(mosaicConfig, originMessageHash, hashLockSecret),
      auxiliaryChain.progressWithSecret(mosaicConfig, originMessageHash, hashLockSecret),
    ]);

    Initialization.writeMosaicConfigToUtilityChainDirectory(mosaicConfig, auxiliaryChain.getChainId());
  }

  /**
   * Generates new accounts, chain, and starts a running sealer to run the new chain.
   */
  private static async startAuxiliary(
    mosaicConfig: MosaicConfig,
    auxiliaryChain: AuxiliaryChain,
  ): Promise<[MosaicConfig, AuxiliaryChain]> {
    mosaicConfig = auxiliaryChain.generateAccounts(mosaicConfig);
    auxiliaryChain.generateChain();
    await auxiliaryChain.startSealer();

    return [mosaicConfig, auxiliaryChain];
  }

  /**
   * Stakes and generates the proof for the stake.
   * @returns The proof.
   */
  private static async initializeOrigin(
    mosaicConfig: MosaicConfig,
    originChain: OriginChain,
    auxiliaryChain: AuxiliaryChain,
    hashLockSecret: string,
  ): Promise<{
    originBlockNumber: number,
    originStateRoot: string,
    originMessageHash: string,
    proofData: Proof
  }> {
    const {
      blockNumber: originBlockNumber,
      stateRoot: originStateRoot,
      messageHash: originMessageHash,
    } = await originChain.stake(mosaicConfig, hashLockSecret);
    const proofData: Proof = await Initialization.getStakeProof(
      originChain.getWeb3(),
      auxiliaryChain.getWeb3(),
      mosaicConfig.originOstGatewayAddress,
      originMessageHash,
      originBlockNumber,
      originStateRoot,
    );

    return {
      originBlockNumber,
      originStateRoot,
      originMessageHash,
      proofData,
    };
  }

  /**
   * Executes the last steps before progressing stake and mint.
   * Transfers all base tokens into the OST prime contract and proves the stake on the co-gateway.
   */
  private static async finalizeAuxiliary(
    mosaicConfig: MosaicConfig,
    auxiliaryChain: AuxiliaryChain,
    originBlockNumber: number,
    originStateRoot: string,
    hashLockSecret: string,
    proofData: Proof,
  ): Promise<MosaicConfig> {
    mosaicConfig = await auxiliaryChain.deployContracts(
      mosaicConfig,
      originBlockNumber.toString(10),
      originStateRoot,
    );
    await auxiliaryChain.transferAllOstIntoOstPrime(mosaicConfig);
    await auxiliaryChain.proveStake(mosaicConfig, hashLockSecret, proofData);

    return mosaicConfig;
  }

  /**
   * Creates the mosaic data directory if it does not exist.
   */
  private static initializeDataDir(mosaicDir): void {
    if (!fs.existsSync(mosaicDir)) {
      Logger.info(`${mosaicDir} does not exist; initializing`);
      fs.mkdirSync(mosaicDir);
    }
  }

  /**
   * Gets the stake proof from the gateway on origin.
   */
  private static getStakeProof(
    originWeb3: Web3,
    auxiliaryWeb3: Web3,
    gatewayAddress: string,
    messageHash: string,
    blockNumber: number,
    stateRoot: string,
  ): Promise<Proof> {
    // Proof requires the block number as string in hex format with leading `0x`.
    const blockNumberString = `0x${blockNumber.toString(16)}`;
    const proofGenerator = new Utils.ProofGenerator(originWeb3, auxiliaryWeb3);
    return proofGenerator.getOutboxProof(
      gatewayAddress,
      [messageHash],
      blockNumberString,
    ).then(
      (proofData) => {
        // Converting to match the Proof class. For later checks, the proof also expects the block
        // number to be a hex string with leading `0x`.
        return {
          accountData: proofData.encodedAccountValue,
          accountProof: proofData.serializedAccountProof,
          storageProof: proofData.storageProof[0].serializedProof,
          blockNumber: blockNumberString,
          stateRoot,
        };
      },
    );
  }

  /**
   * Takes the mosaic config and writes a JSON file into the related utility chain directory.
   */
  private static writeMosaicConfigToUtilityChainDirectory(
    mosaicConfig: MosaicConfig,
    newChainId: string,
  ): void {
    const configPath = path.join(
      Directory.getProjectUtilityChainDir(newChainId),
      'config.json',
    );
    Logger.info('storing mosaic config', { configPath });

    fs.writeFileSync(
      configPath,
      JSON.stringify(mosaicConfig, null, '    '),
    );
  }
}
