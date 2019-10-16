import * as commander from 'commander';
import Logger from '../Logger';
import setupRedeemPool from '../lib/RedeemPool';

const mosaic = commander
  .arguments('<originChain> <auxiliaryChain> <auxChainWeb3EndPoint> <deployer> <organizationOwner> <organizationAdmin>');
mosaic.action(
  async (
    originChain: string,
    auxiliaryChain: string,
    auxChainWeb3EndPoint: string,
    deployer: string,
    organizationOwner: string,
    organizationAdmin: string,
  ) => {
    try {
      await setupRedeemPool(
        originChain,
        auxiliaryChain,
        auxChainWeb3EndPoint,
        deployer,
        organizationOwner,
        organizationAdmin,
      );
    } catch (error) {
      Logger.error('error while executing mosaic setup redeem pool', { error: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
