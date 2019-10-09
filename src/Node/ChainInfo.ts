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
      'goerli'
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
    return (ChainInfo.devChainInfo[chain] !== undefined);
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
}
