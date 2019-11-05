import 'mocha';
import { assert } from 'chai';
import Node from '../../src/Node/Node';
import NodeDescription from '../../src/Node/NodeDescription';
import NodeFactory from '../../src/Node/NodeFactory';
import ParityNode from '../../src/Node/ParityNode';
import GethNode from '../../src/Node/GethNode';
import { GETH_CLIENT } from '../../src/Node/ChainInfo';

describe('NodeFactory.create()', () => {

  it('returns parity node for a chain supported by parity', () => {
    const chains = [
      'ethereum',
      'ropsten',
      'goerli',
    ];

    for (const chain of chains) {
      const node: Node = NodeFactory.create(new NodeDescription(chain));
      assert.instanceOf(node, ParityNode);
    }
  });

  it('returns geth node for a chain supported by parity if client is set to geth', () => {
    const chains = [
      'ethereum',
      'ropsten',
      'goerli',
    ];

    for (const chain of chains) {
      const nodeDescription = new NodeDescription(chain);
      nodeDescription.client = GETH_CLIENT;
      const node: Node = NodeFactory.create(nodeDescription);
      assert.instanceOf(node, GethNode);
    }
  });

  it('returns geth node for a auxiliary chains', () => {
    const chains = [
      '200',
      '1409',
    ];

    for (const chain of chains) {
      const nodeDescription = new NodeDescription(chain);
      nodeDescription.originChain = 'ropsten';
      const node: Node = NodeFactory.create(nodeDescription);
      assert.instanceOf(node, GethNode);
    }
  });
});
