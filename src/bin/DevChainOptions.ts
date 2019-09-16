import ChainInfo from '../Node/ChainInfo';

const DEV_CHAIN_ROOT = 'dev';

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

  /**
   * For the ease of use the mosaic command accepts origin or auxiliary as
   * params to start the dev chains. This function identifies the params
   * provided to the mosaic command. If its dev chains then it returns the
   * proper params that are needed to start the dev chains.
   * @param chain Chain provided in the mosaic command.
   * @param options Options provided in the mosaic command.
   */
  public static getDevChainParams(chain: string, options = { origin: '' }) {
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
