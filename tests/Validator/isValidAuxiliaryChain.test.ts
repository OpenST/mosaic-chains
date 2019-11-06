import 'mocha';
import {assert} from 'chai';
import Validator from '../../src/bin/Validator';

describe('Validation.isValidAuxiliaryChain', () => {
  it('should return true for valid auxiliary chain', () => {
    let auxChain = '1405';
    assert.isTrue(
      Validator.isValidAuxChain(auxChain, 'goerli'), `Must return true for ${auxChain} `,
    );
    auxChain = '1406';
    assert.isTrue(
      Validator.isValidAuxChain(auxChain, 'ropsten'), `Must return true for ${auxChain} `,
    );
    auxChain = '1407';
    assert.isTrue(
      Validator.isValidAuxChain(auxChain, 'ropsten'), `Must return true for ${auxChain} `,
    );
  });

  it('should return true for dev auxiliary chain', () => {
    let auxChain = 'dev-auxiliary';
    assert.isTrue(
      Validator.isValidAuxChain(auxChain, 'dev-origin'), `Must return true for ${auxChain} `,
    );
    auxChain = '1000';
    assert.isTrue(
      Validator.isValidAuxChain(auxChain, 'dev-origin'), `Must return true for ${auxChain} `,
    );
  });

  it('should return false for invalid aux chain', () => {
    const originChain = '2000';
    assert.isNotTrue(
      Validator.isValidAuxChain(originChain, 'invalid'), `Must return false for ${originChain} `,
    );
  });
});
