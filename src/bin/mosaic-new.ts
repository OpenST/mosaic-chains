#!/usr/bin/env node

import * as mosaic from 'commander';
import * as Web3 from 'web3';
import { version } from '../../package.json';
import OriginChain from '../NewChain/OriginChain';
import InitConfig from '../Config/InitConfig';
import { randomBytes } from 'crypto';
import Initialize from '../NewChain/Initialize';
import AuxiliaryChain from '../NewChain/AuxiliaryChain';

mosaic
  .version(version)
  .arguments('<new-chain-id> <origin-websocket>')
  .action(
    async (
      newChainId: string,
      originWebsocket: string,
    ) => {
      // TODO: option to set mosaic dir
      const mosaicDir = '~/.mosaic';
      // TODO: option to set password file
      const password = './password.txt';

      const initConfig: InitConfig = InitConfig.createFromFile(newChainId);
      const originWeb3: Web3 = new Web3(originWebsocket);
      const hashLockSecret: string = Web3.utils.sha3(randomBytes.toString());

      const originChain: OriginChain = new OriginChain(initConfig, originWeb3, hashLockSecret);
      const auxiliaryChain: AuxiliaryChain = new AuxiliaryChain(newChainId, mosaicDir, password);

      const initialize: Initialize = new Initialize(originChain, auxiliaryChain);

      await initialize.newAuxiliaryChain();
    }
  )
  .parse(process.argv);
