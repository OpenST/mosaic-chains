import Node from './Node';
import GethNode from './GethNode';
import ParityNode from './ParityNode';
import NodeDescription from './NodeDescription';

/**
 * Builds node based on the given chain id.
 */
export default class NodeFactory {
  /**
   * If a chain id matches any of these, it will build a parity node.
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
   * Builds a node based on the `chainId` and returns it.
   * Any chain id that matches `ChainFactory.officialIdentifiers` will return a `ParityNode`.
   * Otherwise, it returns a `GethNode`.
   * @param nodeDescription The parameters of the requested node.
   * @returns The node; based of the given input.
   */
  public static create(nodeDescription: NodeDescription): Node {
    if (NodeFactory.officialIdentifiers.includes(nodeDescription.chainId)) {
      return new ParityNode(nodeDescription);
    } else {
      return new GethNode(nodeDescription);
    }
  }
}
