import Web3 = require('web3');

export class Utils {

  /**
   * It provides checksum address using web3.
   * @param address Address.
   * @returns It returns checksum address.
   */
  public static toChecksumAddress(address: string): string {
    return Web3.utils.toChecksumAddress(address);
  }
}
