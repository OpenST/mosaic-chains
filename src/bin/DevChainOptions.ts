export default class DevChainOptions {
  public static isDevChain(chain: string, options = { origin: '' }): boolean {
    return (
      chain === 'origin'
      || chain === 'dev'
      || chain === 'auxiliary'
      || options.origin === 'dev'
    );
  }

  public static getDevChainParams(chain: string, options = { origin: '' }) {
    let chainInput = chain;
    const optionInput = Object.assign({}, options);
    if (chain === 'origin') {
      chainInput = 'dev';
    } else if (chain === 'auxiliary') {
      chainInput = '1000';
      optionInput.origin = 'dev';
    }
    return {
      chain: chainInput,
      options: optionInput,
    };
  }
}
