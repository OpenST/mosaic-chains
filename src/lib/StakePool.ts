import PublishMosaicConfig from '../Config/PublishMosaicConfig';
import OriginChainInteract from '../NewChain/OriginChainInteract';
import MosaicConfig from '../Config/MosaicConfig';

import Web3 = require('web3');

/**
 * This function deploys stake pool(OST composer contract).
 * @param chain Origin chain identifier.
 * @param originWebsocket Websocket connection for origin chain.
 * @param deployer Address of the deployer.
 * @param organizationOwner Address of organization owner of OST Composer.
 * @param organizationAdmin Address of organization admin of OST Composer.
 */
const deployStakePool = async (
  chain: string,
  originWebsocket: string,
  deployer: string,
  organizationOwner: string,
  organizationAdmin: string,
): Promise<void> => {
  // Publishes mosaic configs for existing chains
  PublishMosaicConfig.tryPublish(chain);

  const originWeb3 = new Web3(originWebsocket);
  const ostComposer = await OriginChainInteract.setupOSTComposer(
    originWeb3,
    organizationOwner,
    organizationAdmin,
    deployer,
  );

  const mosaicConfig: MosaicConfig = MosaicConfig.fromChain(chain);
  mosaicConfig.originChain.chain = chain;
  mosaicConfig.originChain.contractAddresses.stakePoolAddress = ostComposer.options.address;

  mosaicConfig.writeToMosaicConfigDirectory();
};

export default deployStakePool;
