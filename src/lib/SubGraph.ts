import GatewayAddresses from '../Config/GatewayAddresses';
import GatewayConfig from '../Config/GatewayConfig';
import MosaicConfig from '../Config/MosaicConfig';
import SubGraph, { SubGraphType } from '../Graph/SubGraph';
import Validator from '../bin/Validator';

const deploySubGraph = (
  originChain: string,
  auxiliaryChain: string,
  subgraphType: SubGraphType,
  graphAdminRPC: string,
  graphIPFS: string,
  mosaicConfigPath?: string,
  gatewayAddress?: string,
  gatewayConfigPath?: string,
): {success: boolean; message: string; subgraphName: string} => {
  if (!Validator.isValidOriginChain(originChain)) {
    throw new Error(`Invalid origin chain identifier: ${originChain}`);
  }

  if (!Validator.isValidAuxChain(auxiliaryChain, originChain)) {
    throw new Error(`Invalid aux chain identifier: ${auxiliaryChain}`);
  }
  if (gatewayAddress && !Validator.isValidAddress(gatewayAddress)) {
    throw new Error(`Invalid deployer address: ${gatewayAddress}`);
  }

  let gatewayAddresses: GatewayAddresses;
  let gatewayConfig: GatewayConfig;
  let mosaicConfig: MosaicConfig;

  const inputSet = new Set();
  inputSet.add(mosaicConfigPath);
  inputSet.add(gatewayAddress);
  inputSet.add(gatewayConfigPath);

  if (inputSet.size > 2) {
    throw new Error('Only one option should be passed from --mosaic-config,--gateway-config and --gateway-address.');
  }
  if (gatewayConfigPath) {
    gatewayConfig = GatewayConfig.fromFile(gatewayConfigPath);
  } else if (gatewayAddress) {
    gatewayConfig = GatewayConfig.fromChain(
      originChain,
      parseInt(auxiliaryChain, 10),
      gatewayAddress,
    );
  }

  if (mosaicConfigPath) {
    mosaicConfig = MosaicConfig.fromFile(mosaicConfigPath);
  } else if (MosaicConfig.exists(originChain)) {
    mosaicConfig = MosaicConfig.fromChain(originChain);
  }

  if (gatewayConfig) {
    if (parseInt(auxiliaryChain, 10) !== gatewayConfig.auxChainId) {
      throw new Error(`Auxiliary chain id in gateway config is ${gatewayConfig.auxChainId} but value passed is ${auxiliaryChain}`);
    }
    gatewayAddresses = GatewayAddresses.fromGatewayConfig(gatewayConfig);
  } else if (mosaicConfig) {
    if (mosaicConfig.originChain.chain !== originChain) {
      throw new Error(`Origin chain id in mosaic config is ${mosaicConfig.originChain.chain} but received argument is ${originChain}`);
    }
    gatewayAddresses = GatewayAddresses.fromMosaicConfig(
      mosaicConfig,
      auxiliaryChain.toString(),
    );
  }

  if (!gatewayAddresses) {
    throw new Error('Mosaic config or gateway config not found . Use --mosaic-config or --gateway-config option to provide path.');
  }

  return new SubGraph(
    originChain,
    auxiliaryChain.toString(),
    subgraphType,
    graphAdminRPC,
    graphIPFS,
    gatewayAddresses,
  ).deploy();

};

export default deploySubGraph;
