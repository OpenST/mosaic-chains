/**
 * Builds node based on the given chain id.
 */
export default class ChainInfo {
  /**
   * If a chain id matches any of these, it will build a parity node.
   */
  public static get officialIdentifiers(): string[] {
    return Object.keys(ChainInfo.chainInfo as string[]);
  }

  /**
   * Mapping of chain name against chain id.
   */
  public static get chainInfo(): any {
    return {
      ethereum: '1',
      classic: '61',
      poacore: '99',
      expanse: '2',
      ellaism: '64',
      easthub: '7',
      social: '28',
      mix: '76',
      callisto: '820',
      morden: '62',
      ropsten: '3',
      kovan: '42',
      poasokol: '77',
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
   * available in `ChainInfo.chainInfo`, then it will return chain as chain id.
   * @param chain Chain name or chain id.
   * @returns Chain id; based on the given input.
   */
  public static getChainId(chain: string): string {
    // Check if the chain is dev chains.
    const chainId = ChainInfo.devChainInfo[chain];
    if (chainId) {
      return chainId;
    }
    return ChainInfo.chainInfo[chain] || chain;
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
