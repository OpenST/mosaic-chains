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
 * @param mosaicConfigObject Mosaic config Object.
 */
const setupRedeemPool = async (
  originChain: string,
  auxiliaryChain: string,
  auxiliaryChainEndPoint: string,
  deployer: string,
  organizationOwner: string,
  organizationAdmin: string,
  mosaicConfigObject?: MosaicConfig,
): Promise<string> => {
  // Publishes mosaic configs for existing chains
  PublishMosaicConfig.tryPublish(originChain);

  if (!(MosaicConfig.exists(originChain) || mosaicConfigObject)) {
    throw new MosaicConfigNotFoundException(`Mosaic config for ${originChain} not found.`);
  }

  const mosaicConfig = mosaicConfigObject || MosaicConfig.fromChain(originChain);

  const auxiliaryWeb3 = new Web3(auxiliaryChainEndPoint);
  const gasPrice = await auxiliaryWeb3.eth.getGasPrice();
  const redeemPool = await Contracts.setupRedeemPool(
    auxiliaryWeb3,
    organizationOwner,
    organizationAdmin,
    { from: deployer, gasPrice },
  );

  if (!mosaicConfig.auxiliaryChains[auxiliaryChain]) {
    throw new Error(
      `Mosaic config for ${originChain} does not contain auxiliary chain ${auxiliaryChain}.`,
    );
  }
  mosaicConfig.auxiliaryChains[auxiliaryChain]
    .contractAddresses
    .auxiliary
    .redeemPoolAddress = redeemPool.options.address;
  mosaicConfig.writeToMosaicConfigDirectory();
  return redeemPool.options.address;
};

export default setupRedeemPool;
