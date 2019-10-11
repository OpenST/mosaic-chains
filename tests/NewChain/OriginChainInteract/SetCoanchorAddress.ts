import 'mocha';
import * as sinon from 'sinon';
import { ContractInteract } from '@openst/mosaic.js';
import InitConfig from '../../../src/Config/InitConfig';
import OriginChainInteract from '../../../src/NewChain/OriginChainInteract';
import SpyAssert from '../../test_utils/SpyAssert';

describe('OriginChainInteract.setCoAnchorAddress()', () => {
  let mockInitConfig;
  let web3;
  const auxiliaryChainId = '123';
  let originChainInteract: OriginChainInteract;
  let anchor;
  let setCoAnchorSpy;
  const fakeReceipt = 'TXReceipt';
  const originTxOptions = {
    from: '0x000000000000000000000000000000000000001',
  };
  const coAnchorAddress = '0x000000000000000000000000000000000000002';

  beforeEach(() => {
    mockInitConfig = sinon.createStubInstance(InitConfig);

    mockInitConfig.originTxOptions = originTxOptions;

    web3 = sinon.fake();

    originChainInteract = new OriginChainInteract(
      mockInitConfig,
      web3,
      auxiliaryChainId,
    );

    anchor = sinon.createStubInstance(ContractInteract.Anchor);
    setCoAnchorSpy = sinon.replace(
      anchor,
      'setCoAnchorAddress',
      sinon.fake.resolves(fakeReceipt),
    );
  });

  it('should set co-anchor address', async () => {
    await originChainInteract.setCoAnchorAddress(
      anchor,
      coAnchorAddress,
    );

    SpyAssert.assert(
      setCoAnchorSpy,
      1,
      [[
        coAnchorAddress,
        originTxOptions,
      ]],
    );
  });
});
