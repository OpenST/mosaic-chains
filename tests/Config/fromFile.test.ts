import 'mocha';
import * as sinon from 'sinon';
import { assert } from 'chai';
import GatewayConfig from '../../src/Config/GatewayConfig';


describe('GatewayConfig.fromFile()', () => {
  const filePath = './tests/Config/testdata/0xae02c7b1c324a8d94a564bc8d713df89eae441fe.json';
  const auxChainId = 1000;
  const originBaseTokenAddress = '0x8e183Fd2cd55C7C05bBf4FAC989740f69e559A6d';
  const valueTokenAddress = '0x8e183Fd2cd55C7C05bBf4FAC989740f69e559A6d';
  const gatewayOrganizationAddress = '0x3f99f42d226A0CD1C1Fcae1e8dC11b2f7a9DcE4B';
  const eip20GatewayAddress = '0xaE02C7b1C324A8D94A564bC8d713Df89eae441fe';
  const coGatewayOrganizationAddress = '0x2D586C7E220839a9284888B10aDF4823AcD6EdF3';
  const utilityTokenAddress = '0x62F8729C1C282C231a22252e90CE9735533D2518';
  const eip20CoGatewayAddress = '0xc6fF898ceBf631eFb58eEc7187E4c1f70AE8d943';

  it('Should return TokenConfig object', async () => {
    const gatewayConfig = GatewayConfig.fromFile(filePath);

    assert.strictEqual(
      gatewayConfig.auxChainId,
      auxChainId,
      'Expected GatewayConfig auxChainId is not equal to actual auxChainId',
    );

    assert.strictEqual(
      gatewayConfig.originContracts.baseTokenAddress,
      originBaseTokenAddress,
      'Expected GatewayConfig baseTokenAddress '
      + 'is not equal to actual originBaseTokenAddress',
    );
    assert.strictEqual(
      gatewayConfig.originContracts.eip20GatewayAddress,
      eip20GatewayAddress,
      'Expected GatewayConfig origin eip20GatewayAddress '
      + 'is not equal to actual eip20GatewayAddress',
    );
    assert.strictEqual(
      gatewayConfig.originContracts.gatewayOrganizationAddress,
      gatewayOrganizationAddress,
      'Expected GatewayConfig origin gatewayOrganizationAddress '
      + 'is not equal to actual gatewayOrganizationAddress',
    );
    assert.strictEqual(
      gatewayConfig.originContracts.valueTokenAddress,
      valueTokenAddress,
      'Expected GatewayConfig origin valueTokenAddress '
      + 'is not equal to actual valueTokenAddress',
    );
    assert.strictEqual(
      gatewayConfig.auxiliaryContracts.utilityTokenAddress,
      utilityTokenAddress,
      'Expected GatewayConfig auxiliary utilityTokenAddress '
      + 'is not equal to actual utilityTokenAddress',
    );
    assert.strictEqual(
      gatewayConfig.auxiliaryContracts.eip20CoGatewayAddress,
      eip20CoGatewayAddress,
      'Expected GatewayConfig eip20CoGatewayAddress '
      + 'is not equal to actual eip20CoGatewayAddress',
    );
    assert.strictEqual(
      gatewayConfig.auxiliaryContracts.coGatewayOrganizationAddress,
      coGatewayOrganizationAddress,
      'Expected GatewayConfig auxiliary coGatewayOrganizationAddress '
      + 'is not equal to actual coGatewayOrganizationAddress',
    );
    sinon.restore();
  });

  it('Should fail when input filePath is incorrect', async () => {
    assert.throws(
      () => GatewayConfig.fromFile('wrongPath'),
      'Missing GatewayConfig file at path: wrongPath',
    );
    sinon.restore();
  });
});
