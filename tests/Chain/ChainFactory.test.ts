import 'mocha';
import { assert } from 'chai';
import Chain from '../../src/Chain/Chain';
import ChainFactory from '../../src/Chain/ChainFactory';
import OfficialChain from '../../src/Chain/OfficialChain';
import UtilityChain from '../../src/Chain/UtilityChain';

describe('ChainFactory.build()', () => {
  it('returns an official chain for an official id', () => {
    const ids = [
      'ethereum',
      'ropsten',
    ];

    for (const id of ids) {
      const chain: Chain = ChainFactory.build(id);
      assert.instanceOf(chain, OfficialChain);
    }
  });

  it('returns a utility chain for a utility id', () => {
    const ids = [
      '200',
      '1409',
    ];

    for (const id of ids) {
      const chain: Chain = ChainFactory.build(id);
      assert.instanceOf(chain, UtilityChain);
    }
  });
});
