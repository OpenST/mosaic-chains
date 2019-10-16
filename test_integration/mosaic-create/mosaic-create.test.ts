import 'mocha';
import * as fs from 'fs';
import { assert } from 'chai';
import Shell from '../../src/Shell';
import Utils from './Utils';
import InitConfig from '../../src/Config/InitConfig';

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
  let originChainId;
  let originDeployerAddress: string;
  let auxiliaryWeb3;
  let auxiliaryEndpoint = 'http://localhost:40500';
  let beneficiary;
  let stakeAmount;

  before(() => {
    stakeAmount = InitConfig.createFromFile(`${auxChainId}`).originStakeAmount;
  });
  it('Start origin chain', async () => {
    await Utils.startOriginChain(originPort);
    originWeb3 = new Web3(originWeb3RPCEndPoint);
    originChainId = await originWeb3.eth.net.getId();
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
    const command = `./mosaic setup-stake-pool ${originChainId} ${originWeb3RPCEndPoint} ${originDeployerAddress} ${originDeployerAddress} ${originDeployerAddress}`;
    Shell.executeInShell(command, { stdio: 'inherit' });
  });

  it('Deploy redeem pool contract', async () => {
    // Second account password.
    const password = fs.readFileSync(passwordFile).toString().trim().split('\n')[1];

    auxiliaryWeb3.eth.personal.unlockAccount(beneficiary, password);
    const command = `./mosaic setup-redeem-pool ${originChainId} ${auxChainId} ${auxiliaryEndpoint} ${beneficiary} ${beneficiary} ${beneficiary}`;
    Shell.executeInShell(command, { stdio: 'inherit' });
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
