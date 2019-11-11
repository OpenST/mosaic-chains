import 'mocha';
import { assert } from 'chai';
import Validator from '../../src/bin/Validator';

describe('Validation.isValidAddress', () => {
  it('should return true for valid address', () => {
    assert.isTrue(
      Validator.isValidAddress('0x0000000000000000000000000000000000000001'), 'Must return true for 0x0000000000000000000000000000000000000001',
    );
  });

  it('should return false for valid address', () => {
    assert.isNotTrue(
      Validator.isValidAddress('0x000000001'), 'Must return true for 0x000000001',
    );
  });
});
