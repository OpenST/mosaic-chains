import * as ip from 'ip';
import * as markdownTable from 'markdown-table';
import ChainInfo from './Node/ChainInfo';

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
}
