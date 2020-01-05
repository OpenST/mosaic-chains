import * as ip from 'ip';
import * as markdownTable from 'markdown-table';
import Integer from './Integer';

import Web3 = require('web3');

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

  /**
   * Generates WS endpoint for subgraph.
   * @param subGraphName Name of subgraph.
   */
  public static graphWSEndpoint(subGraphName: string): string {
    return `ws://{host}:{graph-ws-port}/subgraphs/name/${subGraphName}`;
  }

  /**
   * Generates rpc endpoint for subgraph.
   * @param subgraphName Name of subgraph.
   */
  public static graphRPCEndPoint(subgraphName: string): string {
    return `http://{host}:{graph-http-port}/subgraphs/name/${subgraphName}`;
  }

  /**
   * Print contract addresses in tabular format.
   * @param contractNames Array of contract names.
   * @param addresses Array of contract addresses.
   */
  public static printContracts(contractNames: string[], addresses: string[]): void {
    const rows = [['ContractName', 'Address']];
    for (let i = 0; i < contractNames.length; i++) {
      rows.push([contractNames[i], addresses[i]]);
    }
    const details = markdownTable(rows, {
      align: ['c', 'c'],
    });
    console.log(`\n ${details}`);
  }

  /**
   * Removes the optional leading `0x` of a given string.
   */
  public static removeLeading0x(input: string): string {
    if (input.substring(0, 2) === '0x') {
      input = input.substring(2);
    }

    return input;
  }

  /**
   * @returns The current unix timestamp in hex format with a leading `0x`.
   */
  public static getHexTimestamp(): string {
    const timestampInMilliseconds = Date.now();
    // 1000 milliseconds per second:
    const unixTimestamp = Math.floor(timestampInMilliseconds / 1000);
    const hexTimestamp = unixTimestamp.toString(16);

    return `0x${hexTimestamp}`;
  }

  /**
   * @returns converted to hex with a leading `0x`.
   */
  public static toHex(value: string): string {
    return `0x${Integer.parseString(value).toString(16)}`;
  }

}
