import Node from './Node';
import GethNode from './GethNode';
import ParityNode from './ParityNode';
import NodeDescription from './NodeDescription';
import ChainInfo from './ChainInfo';

/**
 * Builds node based on the given chain id.
 */
export default class NodeFactory {
  /**
   * Builds a node based on the `chain identifier` and returns it.
   * Any chain id that matches `ChainInfo.officialIdentifiers` will return a `ParityNode`.
   * Otherwise, it returns a `GethNode`.
   * @param nodeDescription The parameters of the requested node.
   * @returns The node; based of the given input.
   */
  public static create(nodeDescription: NodeDescription): Node {
    const node = new GethNode(nodeDescription);
    node.readBootnodes();

    return node;
  }
}
