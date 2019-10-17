import * as commander from 'commander';
import Logger from '../Logger';
import setupRedeemPool from '../lib/RedeemPool';
import Validator from './Validator';

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
    if (!Validator.isValidOriginChain(originChain)) {
      console.error(`Invalid origin chain identifier: ${originChain}`)
      process.exit(1);
    }

    if (!Validator.isValidAuxChain(auxiliaryChain)) {
      console.error(`Invalid aux chain identifier: ${auxiliaryChain}`)
      process.exit(1);
    }

    if (!Validator.isValidAddress(deployer)) {
      console.error(`Invalid deployer address: ${deployer}`);
      process.exit(1);
    }
    if (!Validator.isValidAddress(organizationOwner)) {
      console.error(`Invalid organization owner address: ${organizationOwner}`);
      process.exit(1);
    }

    if (!Validator.isValidAddress(organizationAdmin)) {
      console.error(`Invalid organization admin address: ${organizationAdmin}`);
      process.exit(1);
    }

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
