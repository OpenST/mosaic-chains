import ChainInfo from '../Node/ChainInfo';

export const DEV_CHAIN_ROOT = 'dev-origin';

/**
 * For the ease of use of dev chains, the input provided to the mosaic commands
 * are origin or auxiliary. This class helps to identify if the indented chain
 * and provides the appropriate dev chain params.
 */
export default class DevChainOptions {
  /**
   * Identify it the input provided in the mosaic command is for dev chains.
   * @param chain Chain provided in the mosaic command.
   * @param options Options provided in the mosaic command.
   */
  public static isDevChain(chain: string, options = { origin: '' }): boolean {
    return ChainInfo.isDevChain(chain)
      || ChainInfo.isDevOriginChain(options.origin);
  }
}
