import PublishMosaicConfig from '../Config/PublishMosaicConfig';
import Contracts from '../NewChain/Contracts';
import MosaicConfig from '../Config/MosaicConfig';
import { MosaicConfigNotFoundException } from '../Exception';

import Web3 = require('web3');

/**
 * This function deploys redeem pool contract.
 * @param originChain origin chain identifier.
 * @param auxiliaryChain auxiliary chain identifier.
 * @param auxiliaryChainEndPoint Websocket connection for auxiliary chain.
 * @param deployer Address of the deployer.
 * @param organizationOwner Address of organization owner of redeem pool.
 * @param organizationAdmin Address of organization admin of redeem pool.
 * @param mosaicConfigFilePath Mosaic config file path.
 */
const setupRedeemPool = async (
  originChain: string,
  auxiliaryChain: string,
  auxiliaryChainEndPoint: string,
  deployer: string,
  organizationOwner: string,
  organizationAdmin: string,
  mosaicConfigFilePath?: string,
): Promise<string> => {
  // Publishes mosaic configs for existing chains
  PublishMosaicConfig.tryPublish(originChain);

  if (!(MosaicConfig.exists(originChain) || mosaicConfigFilePath)) {
    throw new MosaicConfigNotFoundException(`Mosaic config for ${originChain} not found.`);
  }

  const mosaicConfig = mosaicConfigFilePath
    ? MosaicConfig.fromFile(mosaicConfigFilePath)
    : MosaicConfig.fromChain(originChain);

  if (!mosaicConfig.auxiliaryChains[auxiliaryChain]) {
    throw new Error(
      `Mosaic config for ${originChain} does not contain auxiliary chain ${auxiliaryChain}.`,
    );
  }

  const auxiliaryWeb3 = new Web3(auxiliaryChainEndPoint);
  const gasPrice = await auxiliaryWeb3.eth.getGasPrice();
  const redeemPool = await Contracts.setupRedeemPool(
    auxiliaryWeb3,
    organizationOwner,
    organizationAdmin,
    { from: deployer, gasPrice },
  );
  mosaicConfig.auxiliaryChains[auxiliaryChain]
    .contractAddresses
    .auxiliary
    .redeemPoolAddress = redeemPool.options.address;

  if (mosaicConfigFilePath) {
    mosaicConfig.writeToFile(mosaicConfigFilePath);
  } else {
    mosaicConfig.writeToMosaicConfigDirectory();
  }
  return redeemPool.options.address;
};

export default setupRedeemPool;
