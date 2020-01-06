import 'mocha';
import * as fs from 'fs';
import { assert } from 'chai';

import Shell from '../../src/Shell';
import Utils from './Utils';
import InitConfig from '../../src/Config/InitConfig';
import MosaicConfig from '../../src/Config/MosaicConfig';
import Directory from '../../src/Directory';

import Web3 = require('web3');
import BN = require('bn.js');

/**
 * Integration test for a auxiliary chain setup
 */
describe('Mosaic create', () => {
  const client = process.env.CLIENT;
  const originHost = 'http://localhost';
  const originPort = 8545;
  const originWeb3RPCEndPoint = `${originHost}:${originPort}`;
  const auxChainId = 500;
  const passwordFile = './test_integration/mosaic-create/integration_test_password.txt';
  const mosaicDir = process.env.MOSAIC_DIR || '~/.mosaic';
  const mosaicConfigFilePath = Directory.sanitize(`${mosaicDir}/dev-origin/mosaic.json`);
  const originChainId = 'dev-origin';
  const auxiliaryEndpoint = 'http://localhost:40500';
  let originWeb3;
  let originDeployerAddress: string;
  let auxiliaryWeb3;
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
    const command = `./mosaic create ${auxChainId}  ${originWeb3RPCEndPoint} ${passwordFile} --origin ${originChainId} --client ${client} --mosaic-dir ${mosaicDir}`;
    Shell.executeInShell(command, { stdio: 'inherit' });
  });

  it('Assert beneficiary balance after initial stake and mint', async () => {
    auxiliaryWeb3 = new Web3(auxiliaryEndpoint);
    const accounts = await auxiliaryWeb3.eth.getAccounts();
    // as geth and parity return addresses in different order we had sorted first and then used
    const sortedAccounts = accounts.sort();
    // Select the beneficiary amount i.e. second account as first account is sealer.
    beneficiary = sortedAccounts[1];
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
    const initialMosaicConfig = MosaicConfig.fromFile(mosaicConfigFilePath);
    const command = `./mosaic setup-stake-pool ${originChainId} ${originWeb3RPCEndPoint} ${originDeployerAddress} ${originDeployerAddress} ${originDeployerAddress} --mosaic-config ${mosaicConfigFilePath}`;
    Shell.executeInShell(command, { stdio: 'inherit' });
    const finalMosaicConfig = MosaicConfig.fromFile(mosaicConfigFilePath);

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
    const initialMosaicConfig = MosaicConfig.fromFile(mosaicConfigFilePath);
    auxiliaryWeb3.eth.personal.unlockAccount(beneficiary, password);
    const command = `./mosaic setup-redeem-pool ${originChainId} ${auxChainId} ${auxiliaryEndpoint} ${beneficiary} ${beneficiary} ${beneficiary} --mosaic-config ${mosaicConfigFilePath}`;
    Shell.executeInShell(command, { stdio: 'inherit' });
    const finalMosaicConfig = MosaicConfig.fromFile(mosaicConfigFilePath);
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
    Utils.cleanDirectories(mosaicDir,`${originChainId}`);
  });
});
