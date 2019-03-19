import Chain from './Chain';
import UtilityChain from './UtilityChain';
import OfficialChain from './OfficialChain';

/**
 * Builds chains based on the given chain id.
 */
export default class ChainFactory {
  /**
   * If a chain id matches any of these, it will build an official chain.
   */
  public static get officialIdentifiers(): string[] {
    return [
      'ethereum',
      'classic',
      'poacore',
      'tobalaba',
      'expanse',
      'musicoin',
      'ellaism',
      'easthub',
      'social',
      'mix',
      'callisto',
      'morden',
      'ropsten',
      'kovan',
      'poasokol',
      'testnet',
      'dev',
    ];
  }

  /**
   * Builds a chain based on the `chainId` and returns it.
   * Any chain id that matches `ChainFactory.officialIdentifiers` will return an `OfficialChain`.
   * Otherwise, it returns a `UtilityChain`.
   * @param chainId The id of the chain, e.g. `ropsten` or `200`.
   * @param dataDir Where the chain data will be stored.
   * @param port The publishing port of the docker container.
   * @param rpcPort The publishing rpc port of the docker container.
   * @param websocketPort The publishing ws port of the docker container.
   * @returns The chain based of the given input.
   */
  public static build(
    chainId: string,
    dataDir: string = '~/.mosaic',
    port: number = 30303,
    rpcPort: number = 8545,
    websocketPort: number = 8646,
  ): Chain {
    if (ChainFactory.officialIdentifiers.includes(chainId)) {
      return new OfficialChain(
        chainId,
        dataDir,
        port,
        rpcPort,
        websocketPort,
      );
    } else {
      return new UtilityChain(
        chainId,
        dataDir,
        port,
        rpcPort,
        websocketPort,
      );
    }
  }
}
