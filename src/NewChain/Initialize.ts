import { ContractInteract } from '@openst/mosaic.js';
import * as Web3 from 'web3';
import InitConfig from '../Config/InitConfig';
import Logger from '../Logger';
import MosaicConfig from '../Config/MosaicConfig';
import OriginChain from './OriginChain';
import Directory from '../Directory';
import AuxiliaryChain from './AuxiliaryChain';

export default class Initialize {
  private originChain: OriginChain;
  private auxiliaryChain: AuxiliaryChain;

  constructor(originChain: OriginChain, auxiliaryChain: AuxiliaryChain) {
    this.originChain = originChain;
    this.auxiliaryChain = auxiliaryChain;
  }

  public async newAuxiliaryChain(): Promise<void> {
    // const ostGateway: ContractInteract.EIP20Gateway = await this.originChain.setup();
    this.auxiliaryChain.generateAccounts();
    // TODO: create sealer and deployer addresses auxiliary
    // TODO: beneficiary unknown: await this.originChain.stake(ostGateway, beneficiary);
  }
}
