import {interacts} from '@openst/mosaic-contracts';
import MosaicConfig from '@openst/mosaic-chains/lib/src/Config/MosaicConfig';

import {TransactionObject} from '@openst/mosaic-contracts/dist/interacts/types';
import {
  Utils as MosaicUtils,
} from '@openst/mosaic.js';
import {OSTComposer} from '@openst/mosaic-contracts/dist/interacts/OSTComposer';
import {RedeemPool} from '@openst/mosaic-contracts/dist/interacts/RedeemPool';

import Web3 = require('web3');

import BN = require('bn.js');
import Logger from "../src/Logger";

const originWeb3EndPoint = process.env.ORIGIN_WEB3_ENDPOINT;
const auxiliaryweb3EndPoint = process.env.AUXILIARY_WEB3_ENDPOINT;
const auxiliaryChainId = process.env.AUXILIARY_CHAIN_ID;
const mosaicConfigPath = process.env.MOSAIC_CONFIG_PATH;
const mosaicConfig = MosaicConfig.fromFile(mosaicConfigPath);
const {stakePoolAddress} = mosaicConfig.originChain.contractAddresses;
const {redeemPoolAddress} = mosaicConfig.auxiliaryChains[auxiliaryChainId].contractAddresses.auxiliary;

const originWorker = process.env.ORIGIN_WORKER_ADDRESS;
const auxiliaryWorker = process.env.AUXILIARY_WORKER_ADDRESS;
const originExpirationHeight = process.env.ORIGIN_WORKER_EXPIRATION_HEIGHT || '1000000';
const auxiliaryExpirationHeight = process.env.AUXILIARY_WORKER_EXPIRATION_HEIGHT || '1000000';

const originWeb3 = new Web3(originWeb3EndPoint!);
const auxiliaryWeb3 = new Web3(auxiliaryweb3EndPoint!);

const stakePoolInstance = interacts.getOSTComposer(originWeb3, stakePoolAddress);
const redeemPoolInstance = interacts.getRedeemPool(auxiliaryWeb3, redeemPoolAddress);


async function whitelistWorkersInPool(
  worker: string,
  web3: Web3,
  expirationHeightDiff: string, poolInstance: OSTComposer | RedeemPool,
) {
  const currentBlock = await web3.eth.getBlockNumber();
  const expirationHeight = new BN(currentBlock).add(new BN(expirationHeightDiff));
  const organizationAddress = await poolInstance.methods.organization().call();
  const organizationContractInstance = interacts.getOrganization(web3, organizationAddress);

  const owner = await organizationContractInstance.methods.owner().call();

  Logger.info(`Sending transaction from owner ${owner}, this account should be unlocked`);
  const setWorkerRawTx: TransactionObject<void> = organizationContractInstance.methods.setWorker(
    worker,
    expirationHeight.toString(10),
  );

  const receipt = await MosaicUtils.sendTransaction(setWorkerRawTx, {
    from: owner,
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
