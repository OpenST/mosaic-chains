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
    return Object.keys(NodeFactory.chainInfo as string[]);
  }

  public static get chainInfo(): any {
    return {
      ethereum: '1',
      classic: '61',
      poacore: '1',
      tobalaba: '1',
      expanse: '1',
      musicoin: '1',
      ellaism: '1',
      easthub: '1',
      social: '1',
      mix: '1',
      callisto: '1',
      morden: '1',
      ropsten: '3',
      kovan: '42',
      poasokol: '1',
      testnet: '1',
      dev: '1',
    };
  }

  public static getChainId(chain: string): string {
    const chainId = NodeFactory.chainInfo[chain];
    return chainId || chain;
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
    }
    const node = new GethNode(nodeDescription);
    node.readBootnodes();

    return node;
  }
}
