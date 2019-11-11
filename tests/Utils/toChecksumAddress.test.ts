import * as sinon from 'sinon';
import Web3 = require('web3');

import assert from '../test_utils/assert';
import SpyAssert from '../test_utils/SpyAssert';
import Utils from '../../src/Utils';

describe('Utils.toChecksumAddress()', () => {
  it('should be successfully', () => {
    let address = '0x123Ad';

    const web3Spy = sinon.stub(Web3.utils, 'toChecksumAddress').returns(address);

    const actualAddress = Utils.toChecksumAddress(address);

    assert.strictEqual(
      actualAddress,
      address,
      'Addresses are different',
    );

    SpyAssert.assert(web3Spy, 1, [[address]]);

    sinon.restore();
  });

});
