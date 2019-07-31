/**
 * Builds node based on the given chain id.
 */
export default class ChainInfo {

  /**
   * Bootnodes of ropsten. Refer https://gist.githubusercontent.com/rfikki/c895641b6405c082f68bcf139cf2f7ae/raw/8af5efb74db7be0c36003a81d0363b4e87fb8bbb/ropsten-peers-latest.txt
   */
  public static bootNodes:string = 'enode://a60baadd908740e1fed9690ec399db6cbec47244acecd845a3585ec560f89d9ab96400004412b4dbf59c4e56758824e606ded5be97376ffc012a62869877f9af@155.138.211.79:30303,' +
                                   'enode://3869e363263a54cd930960d485338a7ef1b5b6cd61a4484c81b31f48a2b68200783472a2e7f89c31a86f087e377050720a91cfa82903bd8d45456b6a5e0ffe5f@54.149.176.240:30303,' +
                                   'enode://24cabc9618a4bd4ef3ccfb124b885ddfc352b87bd9f30c4f98f4791b6e81d58824f2c8b451bbdbac25a1b6311b9e12e50775ee49cdb1847c3132b4abfa7842c2@54.39.102.3:30302,' +
                                   'enode://eecaf5852a9f0973d20fd9cb20b480ab0e47fe4a53a2395394e8fe618e8c9e5cb058fd749bf8f0b8483d7dc14c2948e18433490f7dd6182455e3f046d2225a8c@52.221.19.47:30303';

  /**
   * If a chain id matches any of these, it will build a parity node.
   */
  public static get officialIdentifiers(): string[] {
    return Object.keys(ChainInfo.chainInfo as string[]);
  }

  /**
   * Mapping of chain name against chain id.
   */
  public static get chainInfo(): object {
    return {
      ethereum: '1',
      ropsten: '3',
      goerli: '5'
    };
  }

  /**
   * It add options based on chainid.
   * @param chainid Chain id.
   * @returns List of options.
   */
  public static gethOptions(chainid: string): string[] {
    switch (chainid) {
      case 'goerli':
        return ['--goerli'];
      case 'ropsten':
        return ['--testnet',
          '--bootnodes',
          `${ChainInfo.bootNodes}`
        ];
      case 'ethereum':
        return ['--networkid', '1'];
      default:
        return ['--networkid', `${chainid}`];
    }
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
