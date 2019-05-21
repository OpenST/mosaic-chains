import * as fs from 'fs';
import * as path from 'path';
import { Utils } from '@openst/mosaic.js';

import InitConfig from '../Config/InitConfig';
import MosaicConfig from '../Config/MosaicConfig';
import OriginChain from './OriginChain';
import AuxiliaryChain from './AuxiliaryChain';
import NodeDescription from '../Node/NodeDescription';
import Logger from '../Logger';
import Proof from './Proof';
import Directory from '../Directory';

import Web3 = require('web3');

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
    // Preparing environment and objects before actually creating the new chain:
    const initConfig: InitConfig = InitConfig.createFromFile(newChainId);

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

    // Actually creating the new chain:
    await Initialization.createAuxiliaryChain(
      auxiliaryNodeDescription,
      mosaicConfig,
      originChain,
      auxiliaryChain,
      hashLockSecret,
      initConfig,
    );

    Logger.warn(
      '⚠️ The new sealer is still running at a gas price of zero. If you want to change the gas cost, you need to run a different sealer.',
    );
    Logger.warn(
      `⚠️ The new auxiliary chain requires bootnodes. Add a \`bootnodes\` file to \`${Directory.getProjectUtilityChainDir(newChainId)}\`.`,
    );
  }

  /**
   * Verifies that the current host environment is not blocking initialization of a new chain.
   */
  private static environmentIsClean(nodeDescription: NodeDescription): boolean {
    const chainDir = path.join(nodeDescription.mosaicDir, nodeDescription.chainId);
    if (fs.existsSync(chainDir)) {
      Logger.error('chain dir exists; it must not exist to generate a new chain', { chainDir });
      return false;
    }

    return true;
  }

  /**
   * Creates a new auxiliary chain from a new genesis with a new docker container.
   * This method is deliberately written in a way where it executes all steps transparently one
   * after the other and updates the mosaic config based on the return values.
   */
  private static async createAuxiliaryChain(
    auxiliaryNodeDescription: NodeDescription,
    mosaicConfig: MosaicConfig,
    originChain: OriginChain,
    auxiliaryChain: AuxiliaryChain,
    hashLockSecret: string,
    initConfig: InitConfig,
  ): Promise<void> {
    Initialization.initializeDataDir(auxiliaryNodeDescription.mosaicDir);
    mosaicConfig.auxiliaryChainId = auxiliaryNodeDescription.chainId;

    const { sealer, deployer } = await auxiliaryChain.startNewChainSealer();
    mosaicConfig.auxiliaryOriginalSealer = sealer;
    mosaicConfig.auxiliaryOriginalDeployer = deployer;

    const auxiliaryStateRootZero: string = await auxiliaryChain.getStateRootZero();
    const expectedOstCoGatewayAddress: string = auxiliaryChain.getExpectedOstCoGatewayAddress(
      mosaicConfig.auxiliaryOriginalDeployer,
    );

    const {
      anchorOrganization: originAnchorOrganization,
      anchor: originAnchor,
      ostGatewayOrganization,
      ostGateway,
    } = await originChain.deployContracts(
      auxiliaryStateRootZero,
      expectedOstCoGatewayAddress,
    );
    mosaicConfig.originAnchorOrganizationAddress = originAnchorOrganization.address;
    mosaicConfig.originAnchorAddress = originAnchor.address;
    mosaicConfig.originOstGatewayOrganizationAddress = ostGatewayOrganization.address;
    mosaicConfig.originOstGatewayAddress = ostGateway.address;

    const {
      blockNumber: originBlockNumber,
      stateRoot: originStateRoot,
      messageHash: originMessageHash,
      nonce: stakeMessageNonce,
    } = await originChain.stake(mosaicConfig.auxiliaryOriginalDeployer, hashLockSecret);

    const proofData: Proof = await Initialization.getStakeProof(
      originChain.getWeb3(),
      auxiliaryChain.getWeb3(),
      mosaicConfig.originOstGatewayAddress,
      originMessageHash,
      originBlockNumber,
      originStateRoot,
    );

    const {
      anchorOrganization,
      anchor,
      coGatewayAndOstPrimeOrganization,
      ostPrime,
      ostCoGateway,
    } = await auxiliaryChain.initializeContracts(
      mosaicConfig.originOstGatewayAddress,
      originBlockNumber.toString(10),
      originStateRoot,
      stakeMessageNonce,
      hashLockSecret,
      proofData,
    );
    mosaicConfig.auxiliaryAnchorOrganizationAddress = anchorOrganization.address;
    mosaicConfig.auxiliaryAnchorAddress = anchor.address;
    mosaicConfig
      .auxiliaryCoGatewayAndOstPrimeOrganizationAddress = coGatewayAndOstPrimeOrganization.address;
    mosaicConfig.auxiliaryOstPrimeAddress = ostPrime.address;
    mosaicConfig.auxiliaryOstCoGatewayAddress = ostCoGateway.address;

    // Progressing on both chains in parallel (with hash lock secret).
    // Giving the deployer the amount of coins that were originally staked as tokens on origin.
    await Promise.all([
      originChain.progressWithSecret(
        mosaicConfig.auxiliaryOstCoGatewayAddress,
        originMessageHash,
        hashLockSecret,
      ),
      auxiliaryChain.progressWithSecret(
        mosaicConfig.auxiliaryOstCoGatewayAddress,
        originMessageHash,
        hashLockSecret,
      ),
    ]);

    // Resets ostGateway organization admin address in origin chain as admin is deployer here.
    // Resets coGatewayAndOstPrime organization admin address in aux chain as admin is deployer here.
    await Promise.all([
      originChain.resetOrganizationAdmin(ostGatewayOrganization.address, initConfig.originTxOptions.from),
      auxiliaryChain.resetOrganizationAdmin(coGatewayAndOstPrimeOrganization.address, deployer),
    ]);

    mosaicConfig.writeToUtilityChainDirectory();
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
  private static async getStakeProof(
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
    const proofData = await proofGenerator.getOutboxProof(
      gatewayAddress,
      [messageHash],
      blockNumberString,
    );
    // Converting to match the Proof class. For later checks, the proof also expects the block
    // number to be a hex string with leading `0x`.
    return {
      accountData: proofData.encodedAccountValue,
      accountProof: proofData.serializedAccountProof,
      storageProof: proofData.storageProof[0].serializedProof,
      blockNumber,
      stateRoot,
    };
  }
}
