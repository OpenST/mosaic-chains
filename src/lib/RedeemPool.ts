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
 */
const setupRedeemPool = async (
  originChain: string,
  auxiliaryChain: string,
  auxiliaryChainEndPoint: string,
  deployer: string,
  organizationOwner: string,
  organizationAdmin: string,
): Promise<void> => {
  // Publishes mosaic configs for existing chains
  PublishMosaicConfig.tryPublish(originChain);

  const auxiliaryWeb3 = new Web3(auxiliaryChainEndPoint);
  const redeemPool = await Contracts.setupRedeemPool(
    auxiliaryWeb3,
    organizationOwner,
    organizationAdmin,
    { from: deployer, gasPrice: 0 },
  );

  if (!MosaicConfig.exists(originChain)) {
    throw new MosaicConfigNotFoundException(`Mosaic config for ${originChain} not found.`);
  }

  const mosaicConfig = MosaicConfig.fromChain(originChain);

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
};

export default setupRedeemPool;
