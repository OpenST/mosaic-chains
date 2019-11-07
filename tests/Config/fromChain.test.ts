import 'mocha';
import * as sinon from 'sinon';
import { assert } from 'chai';
import GatewayConfig from '../../src/Config/GatewayConfig';
import Directory from '../../src/Directory';
import SpyAssert from '../test_utils/SpyAssert';

describe('GatewayConfig.fromChain()', () => {
  const filePath = './tests/Config/testdata/0xae02c7b1c324a8d94a564bc8d713df89eae441fe.json';
  const originChain = 'dev';
  const auxChainId = 1000;
  const originBaseTokenAddress = '0x9ac77f4c0ca4d0f2142d7a77175cf4f1295fb2d8';
  const valueTokenAddress = '0x8e183Fd2cd55C7C05bBf4FAC989740f69e559A6d';
  const gatewayOrganizationAddress = '0x3f99f42d226A0CD1C1Fcae1e8dC11b2f7a9DcE4B';
  const eip20GatewayAddress = '0xaE02C7b1C324A8D94A564bC8d713Df89eae441fe';
  const coGatewayOrganizationAddress = '0x2D586C7E220839a9284888B10aDF4823AcD6EdF3';
  const utilityTokenAddress = '0x62F8729C1C282C231a22252e90CE9735533D2518';
  const eip20CoGatewayAddress = '0xc6fF898ceBf631eFb58eEc7187E4c1f70AE8d943';

  it('Should return TokenConfig object', async () => {
    const getGatewayConfigPathSpy = sinon.replace(
      Directory,
      'getGatewayConfigPath',
      sinon.fake.returns(filePath),
    );

    const gatewayConfig = GatewayConfig.fromChain(originChain, auxChainId, eip20GatewayAddress);


    SpyAssert.assert(
      getGatewayConfigPathSpy,
      1,
      [[originChain, auxChainId, eip20GatewayAddress]],
    );

    assert.strictEqual(
      gatewayConfig.auxChainId,
      auxChainId,
      'Expected GatewayConfig auxChainId is not equal to actual auxChainId',
    );

    assert.strictEqual(
      gatewayConfig.originContracts.baseTokenAddress,
      originBaseTokenAddress,
      'Expected GatewayConfig origin baseTokenAddress is '
      + 'not equal to actual baseTokenAddress',
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

  it('Should fail when origin chain is incorrect', async () => {
    const expectedFilePath = Directory.getGatewayConfigPath(
      'wrongChain',
      auxChainId,
      eip20GatewayAddress,
    );
    assert.throws(
      () => GatewayConfig.fromChain('wrongChain', auxChainId, eip20GatewayAddress),
      `Missing GatewayConfig file at path: ${expectedFilePath}`,
    );
    sinon.restore();
  });

  it('Should fail when aux chain id is incorrect', async () => {
    const expectedFilePath = Directory.getGatewayConfigPath(
      originChain,
      0,
      eip20GatewayAddress,
    );
    assert.throws(
      () => GatewayConfig.fromChain(originChain, 0, eip20GatewayAddress),
      `Missing GatewayConfig file at path: ${expectedFilePath}`,
    );
    sinon.restore();
  });

  it('Should fail when gateway address is incorrect', async () => {
    const expectedFilePath = Directory.getGatewayConfigPath(
      originChain,
      auxChainId,
      '0x19F64B29789F02FFcCE2c37DFB3d65FEaDdea66a',
    );
    assert.throws(
      () => GatewayConfig.fromChain(originChain, auxChainId, '0x19F64B29789F02FFcCE2c37DFB3d65FEaDdea66a'),
      `Missing GatewayConfig file at path: ${expectedFilePath}`,
    );
    sinon.restore();
  });
});
