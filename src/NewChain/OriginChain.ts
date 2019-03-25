import { ContractInteract } from '@openst/mosaic.js';
import * as Web3 from 'web3';
import InitConfig from '../Config/InitConfig';
import Logger from '../Logger';
import MosaicConfig from '../Config/MosaicConfig';

export default class OriginChain {
  private initConfig: InitConfig;
  private originWeb3: Web3;
  private hashLockSecret: string;
  private mosaicConfig: MosaicConfig;

  constructor(initConfig: InitConfig, originWeb3: Web3, hashLockSecret: string) {
    this.initConfig = initConfig;
    this.originWeb3 = originWeb3;
    this.hashLockSecret = hashLockSecret;

    this.mosaicConfig = new MosaicConfig();
  }

  public setup(): Promise<ContractInteract.EIP20Gateway> {
    return this.deployContracts();
  }

  private async deployContracts(): Promise<ContractInteract.EIP20Gateway> {
    Logger.info('deploying contracts on origin');

    const organization = await this.deployOrganization();
    this.mosaicConfig.originOrganizationAddress = organization.address;
    this.logContractDeployment('organization', organization);

    const anchor = await this.deployAnchor(
      this.initConfig.auxiliaryChainId,
      organization.address,
      '0',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    this.mosaicConfig.originAnchorAddress = anchor.address;
    this.logContractDeployment('anchor', anchor);

    const ostGateway = await this.deployOstGateway(
      this.initConfig.originOstAddress,
      anchor.address,
      organization.address,
      this.initConfig.originBounty,
      this.initConfig.originBurnerAddress,
    );
    this.mosaicConfig.originOstGatewayAddress = ostGateway.address;
    this.logContractDeployment('ostGateway', ostGateway);

    return ostGateway;
  }

  /**
   * 
   * @param ostGateway 
   * @returns Transaction receipt.
   */
  public stake(ostGateway: ContractInteract.EIP20Gateway): Promise<void> {
    const nonce = '1';
    const hashLockHash = Web3.utils.sha3(this.hashLockSecret);
    return ostGateway.stake(
      this.initConfig.originAmountOstToStake,
      // TODO: beneficiary,
      // TODO: gas price,
      // TODO: gas limit,
      nonce,
      hashLockHash,
      this.initConfig.originTxOptions,
    );
  }

  private deployOrganization(): Promise<ContractInteract.Organization> {
    return ContractInteract.Organization
      .deploy(
        this.originWeb3,
        this.initConfig.originTxOptions.from,
        this.initConfig.originTxOptions.from,
        [],
        '0',
        this.initConfig.originTxOptions,
      );
  }

  private deployAnchor(remoteChainId: string, organizationAddress: string, blockHeight: string, stateRoot: string): Promise<ContractInteract.Anchor> {
    return ContractInteract.Anchor.deploy(
      this.originWeb3,
      remoteChainId,
      blockHeight,
      stateRoot,
      this.initConfig.originMaxStateRoots,
      organizationAddress,
      this.initConfig.originTxOptions,
    );
  }

  private async deployOstGateway(
    ostAddress: string,
    anchorAddress: string,
    organizationAddress: string,
    bounty: string,
    burnerAddress: string
  ): Promise<ContractInteract.EIP20Gateway> {
    const merklePatriciaProof = await ContractInteract.MerklePatriciaProof.deploy(
      this.originWeb3,
      this.initConfig.originTxOptions,
    );
    const [gatewayLib, messageBus] = await Promise.all([
      ContractInteract.GatewayLib.deploy(
        this.originWeb3,
        merklePatriciaProof.address,
        this.initConfig.originTxOptions,
      ),
      ContractInteract.MessageBus.deploy(
        this.originWeb3,
        merklePatriciaProof.address,
        this.initConfig.originTxOptions,
      ),
    ]);

    return ContractInteract.EIP20Gateway.deploy(
      this.originWeb3,
      ostAddress,
      ostAddress,
      anchorAddress,
      bounty,
      organizationAddress,
      burnerAddress,
      messageBus.address,
      gatewayLib.address,
      this.initConfig.originTxOptions,
    );
  }

  private logContractDeployment(contractName: string, contract: { address: string }): void {
    Logger.info('deployed contract', { chain: 'origin', name: contractName, address: contract.address });
  }
}
