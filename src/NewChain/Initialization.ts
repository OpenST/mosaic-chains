import * as fs from 'fs';
import * as path from 'path';
import {Utils} from '@openst/mosaic.js';
import * as ip from 'ip';


import InitConfig from '../Config/InitConfig';
import MosaicConfig, {AuxiliaryChain} from '../Config/MosaicConfig';
import OriginChainInteract from './OriginChainInteract';
import AuxiliaryChainInteract from './AuxiliaryChainInteract';
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

    const originChainInteract: OriginChainInteract = new OriginChainInteract(initConfig, originWeb3, newChainId);
    const originChainId: string = await originChainInteract.getChainId();

    const auxiliaryChainInteract: AuxiliaryChainInteract = new AuxiliaryChainInteract(
      initConfig,
      newChainId,
      originChainId,
      auxiliaryNodeDescription,
    );

    const mosaicConfig = MosaicConfig.from(originChainId);
    mosaicConfig.originChain.chain = originChainId;
    mosaicConfig.originChain.contractAddresses.simpleTokenAddress = initConfig.originOstAddress;

    // Actually creating the new chain:
    await Initialization.createAuxiliaryChain(
      auxiliaryNodeDescription,
      mosaicConfig,
      originChainInteract,
      auxiliaryChainInteract,
      hashLockSecret,
    );

    await Initialization.resetOrganizationAdmins(
      mosaicConfig,
      originChainInteract,
      auxiliaryChainInteract,
      initConfig.originTxOptions.from,
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
    const chainDir = path.join(nodeDescription.mosaicDir, nodeDescription.chain);
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
    originChainInteract: OriginChainInteract,
    auxiliaryChainInteract: AuxiliaryChainInteract,
    hashLockSecret: string,
  ): Promise<void> {
    Initialization.initializeDataDir(auxiliaryNodeDescription.mosaicDir);
    let auxiliaryChain = new AuxiliaryChain();
    mosaicConfig.auxiliaryChains[auxiliaryNodeDescription.chain] = auxiliaryChain;
    auxiliaryChain.chainId = auxiliaryNodeDescription.chain;

    const { sealer, deployer } = await auxiliaryChainInteract.startNewChainSealer();
    auxiliaryChainInteract.auxiliarySealer = sealer;
    auxiliaryChainInteract.auxiliaryDeployer = deployer;

    const auxiliaryStateRootZero: string = await auxiliaryChainInteract.getStateRootZero();
    const expectedOstCoGatewayAddress: string = auxiliaryChainInteract.getExpectedOstCoGatewayAddress(
      auxiliaryChainInteract.auxiliaryDeployer,
    );

    const {
      anchorOrganization: originAnchorOrganization,
      anchor: originAnchor,
      ostGatewayOrganization,
      ostGateway,
    } = await originChainInteract.deployContracts(
      auxiliaryStateRootZero,
      expectedOstCoGatewayAddress,
      mosaicConfig.originChain.contractAddresses,
    );
    auxiliaryChain.contractAddresses.origin.anchorOrganizationAddress = originAnchorOrganization.address;
    auxiliaryChain.contractAddresses.origin.anchorAddress = originAnchor.address;
    auxiliaryChain.contractAddresses.origin.ostGatewayOrganizationAddress = ostGatewayOrganization.address;
    auxiliaryChain.contractAddresses.origin.ostEIP20GatewayAddress = ostGateway.address;
    auxiliaryChain.genesis = auxiliaryChainInteract.getGenesis();
    auxiliaryChain.bootNodes.push(Initialization.getBootNode(auxiliaryChainInteract, auxiliaryNodeDescription.port));

    const {
      blockNumber: originBlockNumber,
      stateRoot: originStateRoot,
      messageHash: originMessageHash,
      nonce: stakeMessageNonce,
    } = await originChainInteract.stake(auxiliaryChainInteract.auxiliaryDeployer, hashLockSecret);

    const proofData: Proof = await Initialization.getStakeProof(
      originChainInteract.getWeb3(),
      auxiliaryChainInteract.getWeb3(),
      auxiliaryChain.contractAddresses.origin.ostEIP20GatewayAddress,
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
    } = await auxiliaryChainInteract.initializeContracts(
        auxiliaryChain.contractAddresses.origin.ostEIP20GatewayAddress,
      originBlockNumber.toString(10),
      originStateRoot,
      stakeMessageNonce,
      hashLockSecret,
      proofData,
    );
    auxiliaryChain.contractAddresses.auxiliary.anchorOrganizationAddress = anchorOrganization.address;
    auxiliaryChain.contractAddresses.auxiliary.anchorAddress = anchor.address;
    auxiliaryChain.contractAddresses.auxiliary.ostCoGatewayOrganizationAddress = coGatewayAndOstPrimeOrganization.address;
    auxiliaryChain.contractAddresses.auxiliary.ostPrimeAddress = ostPrime.address;
    auxiliaryChain.contractAddresses.auxiliary.ostEIP20CogatewayAddress = ostCoGateway.address;

    // Progressing on both chains in parallel (with hash lock secret).
    // Giving the deployer the amount of coins that were originally staked as tokens on origin.
    await Promise.all([
      originChainInteract.progressWithSecret(
          auxiliaryChain.contractAddresses.auxiliary.ostEIP20CogatewayAddress,
        originMessageHash,
        hashLockSecret,
      ),
      auxiliaryChainInteract.progressWithSecret(
          auxiliaryChain.contractAddresses.auxiliary.ostEIP20CogatewayAddress,
        originMessageHash,
        hashLockSecret,
      ),
    ]);
    mosaicConfig.writeToMosaicConfigDirectory();
  }

  /**
   * Resets ostGateway organization admin address to `address(0)` in origin chain as deployer is admin here.
   * Resets coGatewayAndOstPrime organization admin to `address(0)` in aux chain as deployer is admin here.
   *
   * @param mosaicConfig Object holds the chain ids and addresses of a mosaic chain.
   * @param {OriginChainInteract} originChainInteract OriginChain instance.
   * @param {AuxiliaryChainInteract} auxiliaryChainInteract AuxiliaryChain instance.
   * @param {string} originOrganizationAdmin Gateway organization contract admin.
   *
   * @returns {Promise<void>}
   */
  private static async resetOrganizationAdmins(
    mosaicConfig: MosaicConfig,
    originChainInteract: OriginChainInteract,
    auxiliaryChainInteract: AuxiliaryChainInteract,
    originOrganizationAdmin: string,
  ): Promise<void> {
    let auxiliaryChain = mosaicConfig.auxiliaryChains[auxiliaryChainInteract.getChainId()];
    await Promise.all([
      originChainInteract.resetOrganizationAdmin(
        auxiliaryChain.contractAddresses.origin.ostGatewayOrganizationAddress,
        { from: originOrganizationAdmin },
      ),
      auxiliaryChainInteract.resetOrganizationAdmin(
        auxiliaryChain.contractAddresses.auxiliary.ostCoGatewayOrganizationAddress,
        { from: auxiliaryChainInteract.auxiliaryDeployer },
      ),
    ]);
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

  /**
   * This method returns the enode of the current auxiliary chain.
   * @param auxiliaryChainInteract  Object to interact with auxiliary chain.
   * @param port Port of boot node.
   */
  private static getBootNode(auxiliaryChainInteract : AuxiliaryChainInteract, port : number) {
    return `enode://${auxiliaryChainInteract.getBootNode()}:${ip.address()}:${port}`;
    }
}
