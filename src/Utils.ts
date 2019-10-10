import Web3 = require('web3');

/**
 * It contains utility methods.
 */
export default class Utils {

  /** List of mandatory params required for graph node. */
  public static mandatoryApiForGraphNode = ['eth', 'net'];

  /**
   * Validate the required api's for graphnode.
   * @param api List of api's.
   * @returns True if all mandatory api's are present otherwise false.
   */
  public static validateMandatoryApiForGraphNode(api: string): boolean {
    let count = 0;
    for(const element of this.mandatoryApiForGraphNode) {
      let isPresent = api.includes(element);
      if(isPresent) {
        count ++;
      }
      if(count === this.mandatoryApiForGraphNode.length){
        return true;
      }
    }
    return false;
  }

  /**
   * It provides checksum address using web3.
   * @param address Address.
   * @returns It returns checksum address.
   */
  public static toChecksumAddress(address: string): string {
    return Web3.utils.toChecksumAddress(address);
  }
}
