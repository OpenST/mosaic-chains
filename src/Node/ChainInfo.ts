import { DEV_CHAIN_ROOT } from '../bin/DevChainOptions';

export const GETH_CLIENT = 'geth';
export const PARITY_CLIENT = 'parity';

/**
 * Builds node based on the given chain id.
 */
export default class ChainInfo {
  /**
   * array of supported origin chains.
   */
  public static get chainsSupportedByParity(): string[] {
    return [
      'ethereum',
      'ropsten',
      'goerli',
    ];
  }

  /**
   * Mapping of supported origin chain name against chain id.
   */
  public static get publicOriginChainNameToIdMap(): Record<string, string> {
    return {
      ethereum: '1',
      ropsten: '3',
      goerli: '5',
    };
  }

  /**
   * Mapping of origin dev chain name against chain id.
   */
  public static get devOriginChainInfo(): any {
    return {
      'dev-origin': '1515', // 1515 is the dev origin chain id
    };
  }

  /**
   * Mapping of auxiliary dev chain name against chain id.
   */
  public static get devAuxiliaryChainInfo(): any {
    return {
      'dev-auxiliary': '1000', // 1000 is the dev auxiliary chain id
    };
  }

  /**
   * Mapping of auxiliary dev chain name against chain id.
   */
  public static get devChainInfo(): any {
    let devChains = {};
    devChains = Object.assign(devChains, ChainInfo.devOriginChainInfo);
    devChains = Object.assign(devChains, ChainInfo.devAuxiliaryChainInfo);
    return devChains;
  }

  /**
   * Returns the chain id for the given chain name. If the chain name is not
   * available in `ChainInfo.publicOriginChainNameToIdMap`, then it will return chain as chain id.
   * @param chain Chain name or chain id.
   * @returns Chain id; based on the given input.
   */
  public static getChainId(chain: string): string {
    // Check if the chain is dev chains.
    const chainId = ChainInfo.devChainInfo[chain];
    if (chainId) {
      return chainId;
    }
    return ChainInfo.publicOriginChainNameToIdMap[chain] || chain;
  }

  /**
   * Check if the given chain is a dev chain.
   * @param chain Chain name.
   */
  public static isDevChain(chain: string): boolean {
    const setOfChain = new Set(
      [...Object.keys(ChainInfo.devChainInfo),
        ...Object.values(ChainInfo.devChainInfo)],
    );
    return setOfChain.has(chain);
  }

  /**
   * Check if the given chain is origin dev chain.
   * @param chain Chain name.
   */
  public static isDevOriginChain(chain: string): boolean {
    return (ChainInfo.devOriginChainInfo[chain] !== undefined);
  }

  /**
   * Check if the given chain is auxiliary dev chain.
   * @param chain Chain name.
   */
  public static isDevAuxiliaryChain(chain: string): boolean {
    return (ChainInfo.devAuxiliaryChainInfo[chain] !== undefined);
  }

  /**
   * For the ease of use the mosaic command accepts origin or auxiliary as
   * params to start the dev chains. This function identifies the params
   * provided to the mosaic command. If its dev chains then it returns the
   * proper params that are needed to start the dev chains. For other chains like goerli/1405 or
   * ropsten/1406 return chain without modifying.
   *
   * @param chain Chain provided in the mosaic command.
   * @param options Options provided in the mosaic command.
   */
  public static getChainParams(chain: string, options = { origin: '' }) {
    let chainInput = chain;
    const optionInput = Object.assign({}, options);
    if (ChainInfo.isDevOriginChain(chain)) {
      chainInput = DEV_CHAIN_ROOT;
    } else if (ChainInfo.isDevAuxiliaryChain(chain)) {
      chainInput = ChainInfo.getChainId(chain);
      optionInput.origin = DEV_CHAIN_ROOT;
    }
    return {
      chain: chainInput,
      options: optionInput,
    };
  }
}
