import 'mocha';
import * as sinon from 'sinon';
import GatewayConfig from './../../src/Config/GatewayConfig'
import { assert } from 'chai';
import Directory from "../../src/Directory";
import SpyAssert from "../test_utils/SpyAssert";


describe('GatewayConfig.fromChain()', () => {

  const filePath = './tests/Config/testdata/0xae02c7b1c324a8d94a564bc8d713df89eae441fe.json';
  const originChain = 'dev';
  const auxChainId = 1000;
  const originBaseTokenAddress = '0x8e183Fd2cd55C7C05bBf4FAC989740f69e559A6d';
  const valueTokenAddress = '0x8e183Fd2cd55C7C05bBf4FAC989740f69e559A6d';
  const gatewayOrganizationAddress = '0x3f99f42d226A0CD1C1Fcae1e8dC11b2f7a9DcE4B';
  const eip20GatewayAddress = '0xaE02C7b1C324A8D94A564bC8d713Df89eae441fe';
  const coGatewayOrganizationAddress = '0x2D586C7E220839a9284888B10aDF4823AcD6EdF3';
  const utilityTokenAddress = '0x62F8729C1C282C231a22252e90CE9735533D2518';
  const eip20CoGatewayAddress = '0xc6fF898ceBf631eFb58eEc7187E4c1f70AE8d943';

  it('Should return TokenConfig object', async () => {
    let existsSpy = sinon.replace(
      GatewayConfig,
      'exists' as any,
      sinon.fake.returns(true)
    );

    let getGatewayConfigPathSpy = sinon.replace(
      Directory,
      'getGatewayConfigPath',
      sinon.fake.returns(filePath),
    );

    const gatewayConfig = GatewayConfig.fromChain(originChain, auxChainId, eip20GatewayAddress);

    SpyAssert.assert(
      existsSpy,
      1,
      [[originChain, auxChainId, eip20GatewayAddress]],
    );

    SpyAssert.assert(
      getGatewayConfigPathSpy,
      1,
      [[originChain, auxChainId, eip20GatewayAddress]],
    );

    assert.strictEqual(
      gatewayConfig.auxChainId,
      auxChainId,
    );

    assert.strictEqual(
      gatewayConfig.originContracts.baseTokenAddress,
      originBaseTokenAddress,
    );
    assert.strictEqual(
      gatewayConfig.originContracts.eip20GatewayAddress,
      eip20GatewayAddress,
    );
    assert.strictEqual(
      gatewayConfig.originContracts.gatewayOrganizationAddress,
      gatewayOrganizationAddress,
    );
    assert.strictEqual(
      gatewayConfig.originContracts.valueTokenAddress,
      valueTokenAddress,
    );
    assert.strictEqual(
      gatewayConfig.auxiliaryContracts.utilityTokenAddress,
      utilityTokenAddress,
    );
    assert.strictEqual(
      gatewayConfig.auxiliaryContracts.eip20CoGatewayAddress,
      eip20CoGatewayAddress,
    );
    assert.strictEqual(
      gatewayConfig.auxiliaryContracts.coGatewayOrganizationAddress,
      coGatewayOrganizationAddress,
    );
    sinon.restore();
  });

  it('Should fail when origin chain is incorrect', async () => {
    assert.throws(
      () => GatewayConfig.fromChain('wrongChain', auxChainId, eip20GatewayAddress),
      "Missing GatewayConfig file at path: undefined",
    );
    sinon.restore();
  });

  it('Should fail when aux chain id is incorrect', async () => {
    assert.throws(
      () => GatewayConfig.fromChain(originChain, 0, eip20GatewayAddress),
      "Missing GatewayConfig file at path: undefined",
    );
    sinon.restore();
  });

  it('Should fail when gateway address is incorrect', async () => {
    assert.throws(
      () => GatewayConfig.fromChain(originChain, auxChainId, 'invalidAddress'),
      "Missing GatewayConfig file at path: undefined",
    );
    sinon.restore();
  });

});
