import { interacts } from '@openst/mosaic-contracts';

import { TransactionObject } from '@openst/mosaic-contracts/dist/interacts/types';
import {
  Utils as MosaicUtils,
} from '@openst/mosaic.js';
import { OSTComposer } from '@openst/mosaic-contracts/dist/interacts/OSTComposer';
import { RedeemPool } from '@openst/mosaic-contracts/dist/interacts/RedeemPool';
import MosaicConfig from '../src/Config/MosaicConfig';
import Logger from '../src/Logger';

import Web3 = require('web3');

import BN = require('bn.js');
import assert = require('assert');

const originWeb3EndPoint = process.env.ORIGIN_WEB3_ENDPOINT;
const auxiliaryweb3EndPoint = process.env.AUXILIARY_WEB3_ENDPOINT;
const auxiliaryChainId = process.env.AUXILIARY_CHAIN_ID;
const mosaicConfigPath = process.env.MOSAIC_CONFIG_PATH;
const originWorker = process.env.ORIGIN_WORKER_ADDRESS;
const auxiliaryWorker = process.env.AUXILIARY_WORKER_ADDRESS;
const originExpirationHeight = process.env.ORIGIN_WORKER_EXPIRATION_HEIGHT;
const auxiliaryExpirationHeight = process.env.AUXILIARY_WORKER_EXPIRATION_HEIGHT;
assert(originWorker, 'Origin worker must be defined');
assert(auxiliaryWorker, 'Auxiliary worker must be defined');
assert(originExpirationHeight, 'Origin expiration height must be defined');
assert(auxiliaryExpirationHeight, 'Auxiliary expiration height must be defined');
assert(originWeb3EndPoint, 'Origin web3 endpoint must be defined');
assert(auxiliaryweb3EndPoint, 'Auxiliary web3 endpoint must be defined');
assert(auxiliaryChainId, 'Auxiliary chainId must be defined.');
const mosaicConfig = MosaicConfig.fromFile(mosaicConfigPath);
const { stakePoolAddress } = mosaicConfig.originChain.contractAddresses;
const { redeemPoolAddress } = mosaicConfig
  .auxiliaryChains[auxiliaryChainId].contractAddresses.auxiliary;

assert(stakePoolAddress, 'Stake pool address must be defined');
assert(redeemPoolAddress, 'Redeem pool address must be defined');
const originWeb3 = new Web3(originWeb3EndPoint!);
const auxiliaryWeb3 = new Web3(auxiliaryweb3EndPoint!);

const stakePoolInstance = interacts.getOSTComposer(originWeb3, stakePoolAddress);
const redeemPoolInstance = interacts.getRedeemPool(auxiliaryWeb3, redeemPoolAddress);


/**
 * This method makes set worker transaction to redeempool or ost composer organization.
 * @param worker Address of worker.
 * @param web3 Web3 connection.
 * @param expirationHeightDiff Worker expiration height from current block.
 * @param poolInstance Instance of OSTComposer or RedeemPool.
 */
async function whitelistWorkersInPool(
  worker: string,
  web3: Web3,
  expirationHeightDiff: string, poolInstance: OSTComposer | RedeemPool,
) {
  const currentBlock = await web3.eth.getBlockNumber();
  const expirationHeight = new BN(currentBlock).add(new BN(expirationHeightDiff));
  const organizationAddress = await poolInstance.methods.organization().call();
  const organizationContractInstance = interacts.getOrganization(web3, organizationAddress);

  const admin = await organizationContractInstance.methods.admin().call();

  Logger.info(`Sending transaction from admin ${admin}, this account should be unlocked`);
  const setWorkerRawTx: TransactionObject<void> = organizationContractInstance.methods.setWorker(
    worker,
    expirationHeight.toString(10),
  );

  const receipt = await MosaicUtils.sendTransaction(setWorkerRawTx, {
    from: admin,
    gasPrice: await web3.eth.getGasPrice(),
  });

  Logger.info(`receipt status of whitelisting worker address ${worker} is ${receipt.status}. Transaction hash is ${receipt.transactionHash}`);
}

whitelistWorkersInPool(
  originWorker!,
  originWeb3,
  originExpirationHeight,
  stakePoolInstance,
);
whitelistWorkersInPool(
  auxiliaryWorker!,
  auxiliaryWeb3,
  auxiliaryExpirationHeight,
  redeemPoolInstance,
);
