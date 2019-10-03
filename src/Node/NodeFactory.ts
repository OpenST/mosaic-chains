import Node from './Node';
import GethNode from './GethNode';
import ParityNode from './ParityNode';
import NodeDescription from './NodeDescription';
import ChainInfo, { GETH_CLIENT, PARITY_CLIENT } from './ChainInfo';

/**
 * Builds node based on the given chain id.
 */
export default class NodeFactory {
  /**
   * Builds a node based on the `chain identifier` and returns it.
   * Any chain id that matches `ChainInfo.chainsSupportedByParityClient` will return a `ParityNode`.
   * Otherwise, it returns a `GethNode`.
   * @param nodeDescription The parameters of the requested node.
   * @returns The node; based of the given input.
   */
  public static create(nodeDescription: NodeDescription): Node {
    if (!nodeDescription.client) {
      // default for aux chains is GETH and for origin chains in Parity
      nodeDescription.client = nodeDescription.originChain ? GETH_CLIENT : PARITY_CLIENT;
    }
    if (nodeDescription.client === PARITY_CLIENT) {
      return new ParityNode(nodeDescription);
    }
    const node = new GethNode(nodeDescription);
    node.readBootnodes();

    return node;
  }
}
