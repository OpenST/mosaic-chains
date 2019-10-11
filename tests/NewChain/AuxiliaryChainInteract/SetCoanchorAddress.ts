import 'mocha';
import * as sinon from 'sinon';
import { ContractInteract } from '@openst/mosaic.js';
import InitConfig from '../../../src/Config/InitConfig';
import AuxiliaryChainInteract
  from '../../../src/NewChain/AuxiliaryChainInteract';
import SpyAssert from '../../test_utils/SpyAssert';
import NodeDescription from '../../../src/Node/NodeDescription';

describe('AuxiliaryChainInteract.setCoAnchorAddress()', () => {
  let mockInitConfig;
  const auxiliaryChainId = '123';
  let auxiliaryChainInteract: AuxiliaryChainInteract;
  let anchor;
  let setCoAnchorSpy;
  const fakeReceipt = 'TXReceipt';
  const auxiliaryTxOptions = {
    // Deployer address is not defined aux chain interact it's created on chain setup.
    from: undefined,
    gasPrice: '0',
    gas: '10000000',
  };
  const coAnchorAddress = '0x000000000000000000000000000000000000002';

  beforeEach(() => {
    mockInitConfig = sinon.createStubInstance(InitConfig);

    auxiliaryChainInteract = new AuxiliaryChainInteract(
      mockInitConfig,
      auxiliaryChainId,
      'originChain',
      new NodeDescription(auxiliaryChainId),
    );

    anchor = sinon.createStubInstance(ContractInteract.Anchor);
    setCoAnchorSpy = sinon.replace(
      anchor,
      'setCoAnchorAddress',
      sinon.fake.resolves(fakeReceipt),
    );
  });

  it('should set co-anchor address', async () => {
    await auxiliaryChainInteract.setCoAnchorAddress(
      anchor,
      coAnchorAddress,
    );

    SpyAssert.assert(
      setCoAnchorSpy,
      1,
      [[
        coAnchorAddress,
        auxiliaryTxOptions,
      ]],
    );
  });
});
