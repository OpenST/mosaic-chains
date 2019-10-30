import 'mocha';
import {assert} from 'chai';
import Validator from '../../src/bin/Validator';

describe('Validation.isValidOriginChain', () => {
  it('should return true for valid origin chain', () => {
    let originChain = 'ropsten';
    assert.isTrue(
      Validator.isValidOriginChain(originChain), `Must return true for ${originChain} `,
    );
    originChain = 'ethereum';
    assert.isTrue(
      Validator.isValidOriginChain(originChain), `Must return true for ${originChain} `,
    );
    originChain = 'goerli';
    assert.isTrue(
      Validator.isValidOriginChain(originChain), `Must return true for ${originChain} `,
    );
  });

  it('should return true for dev origin chain', () => {
    let originChain = 'dev-origin';
    assert.isTrue(
      Validator.isValidOriginChain(originChain), `Must return true for ${originChain} `,
    );
    originChain = '1515';
    assert.isTrue(
      Validator.isValidOriginChain(originChain), `Must return true for ${originChain} `,
    );
  });

  it('should return false for invalid origin chain', () => {
    const originChain = '1405';
    assert.isNotTrue(
      Validator.isValidOriginChain(originChain), `Must return false for ${originChain} `,
    );
  });
});
