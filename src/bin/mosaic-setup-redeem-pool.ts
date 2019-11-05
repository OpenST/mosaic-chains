import * as commander from 'commander';
import Logger from '../Logger';
import setupRedeemPool from '../lib/RedeemPool';
import Validator from './Validator';
import MosaicConfig from '../Config/MosaicConfig';
import Utils from "../Utils";

const mosaic = commander
  .arguments('<originChain> <auxiliaryChain> <auxChainWeb3EndPoint> <deployer> <organizationOwner> <organizationAdmin>');
mosaic.option('-m,--mosaic-config <string>', 'Mosaic config absolute path.');
mosaic.action(
  async (
    originChain: string,
    auxiliaryChain: string,
    auxChainWeb3EndPoint: string,
    deployer: string,
    organizationOwner: string,
    organizationAdmin: string,
    options,
  ) => {
    const isValidWeb3Connection = await Validator.isValidWeb3EndPoint(auxChainWeb3EndPoint);
    if (!isValidWeb3Connection) {
      Logger.error('Could not connect to aux node with web3');
    }

    if (!Validator.isValidOriginChain(originChain)) {
      Logger.error(`Invalid origin chain identifier: ${originChain}`);
      process.exit(1);
    }

    if (!Validator.isValidAuxChain(auxiliaryChain, originChain)) {
      Logger.error(`Invalid aux chain identifier: ${auxiliaryChain}`);
      process.exit(1);
    }

    if (!Validator.isValidAddress(deployer)) {
      Logger.error(`Invalid deployer address: ${deployer}`);
      process.exit(1);
    }
    if (!Validator.isValidAddress(organizationOwner)) {
      Logger.error(`Invalid organization owner address: ${organizationOwner}`);
      process.exit(1);
    }

    if (!Validator.isValidAddress(organizationAdmin)) {
      Logger.error(`Invalid organization admin address: ${organizationAdmin}`);
      process.exit(1);
    }

    try {
      let mosaicConfig: MosaicConfig;
      if (options.mosaicConfig) {
        mosaicConfig = MosaicConfig.fromFile(options.mosaicConfig);
      }
      const redeemPoolAddress = await setupRedeemPool(
        originChain,
        auxiliaryChain,
        auxChainWeb3EndPoint,
        deployer,
        organizationOwner,
        organizationAdmin,
        mosaicConfig,
      );
      Utils.printContracts(['Redeem Pool'], [redeemPoolAddress]);
    } catch (error) {
      Logger.error('error while executing mosaic setup redeem pool', { error: error.toString() });
      process.exit(1);
    }

    process.exit(0);
  },
)
  .parse(process.argv);
