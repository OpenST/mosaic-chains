import 'mocha';
import * as fs from 'fs';
import { assert } from 'chai';
import Shell from '../../src/Shell';
import Utils from './Utils';
import InitConfig from '../../src/Config/InitConfig';
import MosaicConfig from '../../src/Config/MosaicConfig';

import Web3 = require('web3');
import BN = require('bn.js');

/**
 * Integration test for a auxiliary chain setup
 */
describe('Mosaic create', () => {
  const originHost = 'http://localhost';
  const originPort = 8545;
  const originWeb3RPCEndPoint = `${originHost}:${originPort}`;
  const auxChainId = 500;
  const passwordFile = './test_integration/mosaic-create/integration_test_password.txt';
  let originWeb3;
  const originChainId = 'dev-origin';
  let originDeployerAddress: string;
  let auxiliaryWeb3;
  const auxiliaryEndpoint = 'http://localhost:40500';
  let beneficiary;
  let stakeAmount;

  before(() => {
    stakeAmount = InitConfig.createFromFile(`${auxChainId}`).originStakeAmount;
  });
  it('Start origin chain', async () => {
    await Utils.startOriginChain(originPort);
    originWeb3 = new Web3(originWeb3RPCEndPoint);
    originDeployerAddress = (await originWeb3.eth.getAccounts())[0];
  });

  it('Deploy re-usable libraries on origin chain', () => {
    const command = `./mosaic libraries ${originChainId} ${originWeb3RPCEndPoint} ${originDeployerAddress}`;
    Shell.executeInShell(command, { stdio: 'inherit' });
  });

  it('Create new auxiliary chain(This also performs initial stake and mint)', () => {
    const command = `./mosaic create ${auxChainId}  ${originWeb3RPCEndPoint} ${passwordFile} --origin ${originChainId}`;
    Shell.executeInShell(command, { stdio: 'inherit' });
  });

  it('Assert beneficiary balance after initial stake and mint', async () => {
    auxiliaryWeb3 = new Web3(auxiliaryEndpoint);
    const accounts = await auxiliaryWeb3.eth.getAccounts();
    // Select the beneficiary amount i.e. second account as first account is sealer.
    beneficiary = accounts[1];
    const beneficiaryBalance = await auxiliaryWeb3.eth.getBalance(beneficiary);
    assert.strictEqual(
      new BN(stakeAmount).eq(new BN(beneficiaryBalance)),
      true,
      `Expected beneficiary ${beneficiary} balance ${stakeAmount} but found ${beneficiaryBalance}`,
    );
  });

  it('Deploy stake pool contract', async () => {
    const initialMosaicConfig = MosaicConfig.fromChain(originChainId);
    const command = `./mosaic setup-stake-pool ${originChainId} ${originWeb3RPCEndPoint} ${originDeployerAddress} ${originDeployerAddress} ${originDeployerAddress}`;
    Shell.executeInShell(command, { stdio: 'inherit' });
    const finalMosaicConfig = MosaicConfig.fromChain(originChainId);

    assert.notStrictEqual(
      initialMosaicConfig.originChain.contractAddresses.stakePoolAddress,
      finalMosaicConfig.originChain.contractAddresses.stakePoolAddress,
      'Stake Pool Address must change',
    );
  });


  it('Deploy stake pool contract with mosaic config option', async () => {
    const filePath = '~/.mosaic/dev-origin/mosaic.json';
    // No mosaic config exists. This will give blank config object.
    const initialMosaicConfig = MosaicConfig.fromChain(originChainId);
    const command = `./mosaic setup-stake-pool ${originChainId} ${originWeb3RPCEndPoint} ${originDeployerAddress} ${originDeployerAddress} ${originDeployerAddress} --mosaic-config ${filePath}`;
    Shell.executeInShell(command, { stdio: 'inherit' });
    const finalMosaicConfig = MosaicConfig.fromFile(filePath);

    assert.notStrictEqual(
      initialMosaicConfig.originChain.contractAddresses.stakePoolAddress,
      finalMosaicConfig.originChain.contractAddresses.stakePoolAddress,
      'Stake Pool Address must change',
    );
  });

  it('Deploy redeem pool contract', async () => {
    // Second account password.
    const password = fs.readFileSync(passwordFile).toString().trim().split('\n')[1];

    auxiliaryWeb3.eth.personal.unlockAccount(beneficiary, password);
    const initialMosaicConfig = MosaicConfig.fromChain(originChainId);
    const command = `./mosaic setup-redeem-pool ${originChainId} ${auxChainId} ${auxiliaryEndpoint} ${beneficiary} ${beneficiary} ${beneficiary}`;
    Shell.executeInShell(command, { stdio: 'inherit' });
    const finalMosaicConfig = MosaicConfig.fromChain(originChainId);
    assert.notStrictEqual(
      initialMosaicConfig.auxiliaryChains[auxChainId].contractAddresses.auxiliary.redeemPoolAddress,
      finalMosaicConfig.auxiliaryChains[auxChainId].contractAddresses.auxiliary.redeemPoolAddress,
      'Redeem Pool Address must change',
    );
  });

  it('Deploy redeem pool contract with mosaic config option', async () => {
    // Second account password.
    const password = fs.readFileSync(passwordFile).toString().trim().split('\n')[1];

    const file = '~/.mosaic/dev-origin/mosaic.json';
    const initialMosaicConfig = MosaicConfig.fromFile(file);
    auxiliaryWeb3.eth.personal.unlockAccount(beneficiary, password);
    const command = `./mosaic setup-redeem-pool ${originChainId} ${auxChainId} ${auxiliaryEndpoint} ${beneficiary} ${beneficiary} ${beneficiary} --mosaic-config ~/.mosaic/dev-origin/mosaic.json`;
    Shell.executeInShell(command, { stdio: 'inherit' });
    const finalMosaicConfig = MosaicConfig.fromFile(file);
    assert.notStrictEqual(
      initialMosaicConfig.auxiliaryChains[auxChainId].contractAddresses.auxiliary.redeemPoolAddress,
      finalMosaicConfig.auxiliaryChains[auxChainId].contractAddresses.auxiliary.redeemPoolAddress,
      'Redeem Pool Address must change',
    );
  });

  it(`Verify auxiliary chain ${auxChainId}`, () => {
    const command = `./mosaic verify-chain ${originWeb3RPCEndPoint} ${auxiliaryEndpoint} ${originChainId} ${auxChainId}`;
    Shell.executeInShell(command, { stdio: 'inherit' });
  });

  after(() => {
    Shell.executeInShell(`./mosaic stop ${auxChainId}`);
    Utils.stopOriginChain();
    Utils.cleanDirectories(`${originChainId}`);
  });
});
