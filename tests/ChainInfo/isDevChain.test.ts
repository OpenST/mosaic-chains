import { assert } from 'chai';
import ChainInfo from '../../src/Node/ChainInfo';

describe('ChainInfo.isDevChain()', () => {
  it('should return true for valid dev chain', async () => {
    assert.isTrue(
      ChainInfo.isDevChain('dev-origin'),
      'dev-origin must be a valid dev chain',
    );

    assert.isTrue(
      ChainInfo.isDevChain('dev-auxiliary'),
      'dev-auxiliary must be a valid dev chain',
    );

    assert.isTrue(
      ChainInfo.isDevChain('1000'),
      '1000 must be a valid dev chain',
    );

    assert.isTrue(
      ChainInfo.isDevChain('1515'),
      '1515 must be a valid dev chain',
    );
  });

  it('should return false for invalid dev chain', async () => {
    assert.isNotTrue(
      ChainInfo.isDevChain('ropsten'),
      'ropsten must be an invalid dev chain',
    );

    assert.isNotTrue(
      ChainInfo.isDevChain('1406'),
      '1406 must be an invalid dev chain',
    );
  });
});
