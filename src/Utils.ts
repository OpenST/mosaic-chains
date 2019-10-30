import Web3 = require('web3');
import * as ip from 'ip';

/**
 * It contains utility methods.
 */
export default class Utils {

  /**
   * It provides checksum address using web3.
   * @param address Address.
   * @returns It returns checksum address.
   */
  public static toChecksumAddress(address: string): string {
    return Web3.utils.toChecksumAddress(address);
  }

  /**
   * It return ip address of the system.
   * @returns  Ip address.
   */
  public static ipAddress(): string {
    return ip.address();
  }
}
