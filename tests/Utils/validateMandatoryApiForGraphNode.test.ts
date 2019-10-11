import assert from '../test_utils/assert';
import Utils from '../../src/Utils';

describe('Utils.validateMandatoryApiForGraphNode()', () => {
  it('should pass when required graph node api are present', () => {

    const api = 'web3,eth,net';

    const isValidate = Utils.validateMandatoryApiForGraphNode(api);

    assert.strictEqual(
      isValidate,
      true,
      'Expected is true',
    );

  });

  it('should fail when required graph node api are not present', () => {

    const api = 'web3,eth';

    const isValidate = Utils.validateMandatoryApiForGraphNode(api);

    assert.strictEqual(
      isValidate,
      false,
      'Expected is false',
    );

  });

});
