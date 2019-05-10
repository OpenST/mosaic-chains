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

  /**
   * Mapping of chain name against chain id.
   */
  public static get chainInfo(): any {
    return {
      ethereum: '1',
      classic: '61',
      poacore: '99',
      expanse: '2',
      ellaism: '64',
      easthub: '7',
      social: '28',
      mix: '76',
      callisto: '820',
      morden: '62',
      ropsten: '3',
      kovan: '42',
      poasokol: '77',
    };
  }

  /**
   * Returns the chain id for the given chain name. If the chain name is not
   * available in `ChainFactory.officialIdentifiers`, then it will return chain as chain id.
   * @param chain Chain name.
   * @returns Chain id; based on the given input.
   */
  public static getChainId(chain: string): string {
    return NodeFactory.chainInfo[chain] || chain;
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
