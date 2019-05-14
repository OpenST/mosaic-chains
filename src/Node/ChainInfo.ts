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
    };
  }

  /**
   * Returns the chain id for the given chain name. If the chain name is not
   * available in `ChainInfo.chainInfo`, then it will return chain as chain id.
   * @param chain Chain name or chain id.
   * @returns Chain id; based on the given input.
   */
  public static getChainId(chain: string): string {
    return ChainInfo.chainInfo[chain] || chain;
  }

}
