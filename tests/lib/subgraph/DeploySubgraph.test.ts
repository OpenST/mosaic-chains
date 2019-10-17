import 'mocha';
import { assert } from 'chai';
import * as sinon from 'sinon';
import * as path from 'path';
import deploySubGraph from '../../../src/lib/SubGraph';
import SubGraph, { SubGraphType } from '../../../src/Graph/SubGraph';
import MosaicConfig from '../../../src/Config/MosaicConfig';
import Directory from '../../../src/Directory';
import SpyAssert from '../../test_utils/SpyAssert';

import someMosaicConfig = require('../../Config/testdata/mosaic.json');

describe('Subgraph.deploySubgraph', () => {
  let input;

  beforeEach(() => {
    input = {
      originChain: 'ropsten',
      auxiliaryChain: '1405',
      subgraphType: SubGraphType.AUXILIARY,
      graphAdminRPC: 'http://localhost:8020',
      graphIPFS: 'http://localhost:5001',
      mosaicConfigPath: '~/.mosaic/ropsten/mosaic.json',
      gatewayAddress: '0x0000000000000000000000000000000000000001',
      gatewayConfigPath: '~/.mosaic/ropsten/1405/0x0000000000000000000000000000000000000001,json',
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should fail if mosaic config not found at default directory', () => {
    input.mosaicConfigPath = undefined;
    input.gatewayAddress = undefined;
    input.gatewayConfigPath = undefined;
    const existsSpy = sinon.replace(
      MosaicConfig,
      'exists',
      sinon.fake.returns(false),
    );

    assert.throws(
      () => deploySubGraph(
        input.originChain,
        input.auxiliaryChain,
        input.subgraphType,
        input.graphAdminRPC,
        input.graphIPFS,
        input.mosaicConfigPath,
        input.gatewayAddress,
        input.gatewayConfigPath,
      ),
      'Mosaic config or gateway config not found . Use --mosaic-config or --gateway-config option to provide path.',
    );
    SpyAssert.assert(existsSpy, 1, [[input.originChain]]);
  });

  it('should fail if mosaic config origin chain is different from passed value', () => {
    input.mosaicConfigPath = undefined;
    input.gatewayAddress = undefined;
    input.gatewayConfigPath = undefined;
    const existsSpy = sinon.replace(
      MosaicConfig,
      'exists',
      sinon.fake.returns(true),
    );

    const fakeMosaicConfig = { originChain: { chain: 'goerli' } };
    const fromChainSpy = sinon.replace(
      MosaicConfig,
      'fromChain',
      sinon.fake.returns(fakeMosaicConfig),
    );

    assert.throws(
      () => deploySubGraph(
        input.originChain,
        input.auxiliaryChain,
        input.subgraphType,
        input.graphAdminRPC,
        input.graphIPFS,
        input.mosaicConfigPath,
        input.gatewayAddress,
        input.gatewayConfigPath,
      ),
      `Origin chain id in mosaic config is ${fakeMosaicConfig.originChain.chain} but received argument is ${input.originChain}`,
    );

    SpyAssert.assert(existsSpy, 1, [[input.originChain]]);
    SpyAssert.assert(fromChainSpy, 1, [[input.originChain]]);
  });

  it('should fail if auxiliary chain id in gateway config does not match passed value', () => {
    input.mosaicConfigPath = undefined;
    input.gatewayAddress = undefined;
    input.gatewayConfigPath = path.join(
      Directory.projectRoot,
      'tests/Config/testdata/0xae02c7b1c324a8d94a564bc8d713df89eae441fe.json',
    );
    assert.throws(
      () => deploySubGraph(
        input.originChain,
        input.auxiliaryChain,
        input.subgraphType,
        input.graphAdminRPC,
        input.graphIPFS,
        input.mosaicConfigPath,
        input.gatewayAddress,
        input.gatewayConfigPath,
      ),
      `Auxiliary chain id in gateway config is 1000 but value passed is ${input.auxiliaryChain}`,
    );
  });

  it('should fail if mosaic config does not exist on mentioned path', () => {
    input.mosaicConfigPath = 'Some wrong path';
    input.gatewayAddress = undefined;
    input.gatewayConfigPath = undefined;

    assert.throws(
      () => deploySubGraph(
        input.originChain,
        input.auxiliaryChain,
        input.subgraphType,
        input.graphAdminRPC,
        input.graphIPFS,
        input.mosaicConfigPath,
        input.gatewayAddress,
        input.gatewayConfigPath,
      ),
      `Missing config file at path: ${input.mosaicConfigPath}`,
    );
  });

  it('should fail if gateway config does not exist on mentioned path', () => {
    input.mosaicConfigPath = undefined;
    input.gatewayAddress = undefined;
    input.gatewayConfigPath = 'Some wrong path';

    assert.throws(
      () => deploySubGraph(
        input.originChain,
        input.auxiliaryChain,
        input.subgraphType,
        input.graphAdminRPC,
        input.graphIPFS,
        input.mosaicConfigPath,
        input.gatewayAddress,
        input.gatewayConfigPath,
      ),
      `Missing GatewayConfig file at path: ${input.gatewayConfigPath}`,
    );
  });

  it('should fail if gateway config does not exist for mentioned gateway address', () => {
    input.mosaicConfigPath = undefined;
    input.gatewayAddress = '0x110000000000000000000000000000000000001';
    input.gatewayConfigPath = undefined;

    assert.throws(
      () => deploySubGraph(
        input.originChain,
        input.auxiliaryChain,
        input.subgraphType,
        input.graphAdminRPC,
        input.graphIPFS,
        input.mosaicConfigPath,
        input.gatewayAddress,
        input.gatewayConfigPath,
      ),
      `Missing GatewayConfig file at path: ${Directory.getGatewayConfigPath(
        input.originChain,
        input.auxiliaryChain,
        input.gatewayAddress,
      )}`,
    );
  });

  it('should fail if all three options are passed', () => {
    assert.throws(
      () => deploySubGraph(
        input.originChain,
        input.auxiliaryChain,
        input.subgraphType,
        input.graphAdminRPC,
        input.graphIPFS,
        input.mosaicConfigPath,
        input.gatewayAddress,
        input.gatewayConfigPath,
      ),
      'Only one option should be passed from --mosaic-config,--gateway-config and --gateway-address.',
    );
  });

  it('should fail if any two options are passed', () => {
    input.mosaicConfigPath = undefined;
    assert.throws(
      () => deploySubGraph(
        input.originChain,
        input.auxiliaryChain,
        input.subgraphType,
        input.graphAdminRPC,
        input.graphIPFS,
        input.mosaicConfigPath,
        input.gatewayAddress,
        input.gatewayConfigPath,
      ),
      'Only one option should be passed from --mosaic-config,--gateway-config and --gateway-address.',
    );
  });

  it('should deploy subgraph if mosaic config exists on default path', () => {
    input.mosaicConfigPath = undefined;
    input.gatewayAddress = undefined;
    input.gatewayConfigPath = undefined;
    input.originChain = someMosaicConfig.originChain.chain;
    input.auxiliaryChain = '1000';

    const existsSpy = sinon.replace(
      MosaicConfig,
      'exists',
      sinon.fake.returns(true),
    );
    const fromChainSpy = sinon.replace(
      MosaicConfig,
      'fromChain',
      sinon.fake.returns(someMosaicConfig),
    );
    const deploySpy = sinon.stub(SubGraph.prototype, 'deploy');

    deploySubGraph(
      input.originChain,
      input.auxiliaryChain,
      input.subgraphType,
      input.graphAdminRPC,
      input.graphIPFS,
      input.mosaicConfigPath,
      input.gatewayAddress,
      input.gatewayConfigPath,
    );

    assert.strictEqual(
      deploySpy.callCount,
      1,
      'Deploy subgraph must be called once',
    );

    SpyAssert.assert(existsSpy, 1, [[input.originChain]]);
    SpyAssert.assert(fromChainSpy, 1, [[input.originChain]]);
  });

  it('should deploy sub-graph if mosaic config is passed as an argument', () => {
    input.mosaicConfigPath = path.join(
      Directory.projectRoot,
      'tests/Config/testdata/mosaic.json',
    );
    input.gatewayAddress = undefined;
    input.gatewayConfigPath = undefined;
    input.originChain = someMosaicConfig.originChain.chain;
    input.auxiliaryChain = '1000';
    const deploySpy = sinon.stub(SubGraph.prototype, 'deploy');

    deploySubGraph(
      input.originChain,
      input.auxiliaryChain,
      input.subgraphType,
      input.graphAdminRPC,
      input.graphIPFS,
      input.mosaicConfigPath,
      input.gatewayAddress,
      input.gatewayConfigPath,
    );

    assert.strictEqual(
      deploySpy.callCount,
      1,
      'Deploy subgraph must be called once',
    );
  });

  it('should deploy sub-graph if gateway config is passed as an argument', () => {
    input.mosaicConfigPath = undefined;
    input.gatewayAddress = undefined;
    input.gatewayConfigPath = path.join(
      Directory.projectRoot,
      'tests/Config/testdata/0xae02c7b1c324a8d94a564bc8d713df89eae441fe.json',
    );
    const deploySpy = sinon.stub(SubGraph.prototype, 'deploy');
    input.auxiliaryChain = '1000';
    deploySubGraph(
      input.originChain,
      input.auxiliaryChain,
      input.subgraphType,
      input.graphAdminRPC,
      input.graphIPFS,
      input.mosaicConfigPath,
      input.gatewayAddress,
      input.gatewayConfigPath,
    );

    assert.strictEqual(
      deploySpy.callCount,
      1,
      'Deploy subgraph must be called once',
    );
  });

  it('should deploy sub-graph if gateway config exits for gateway address', () => {
    input.mosaicConfigPath = undefined;
    input.gatewayAddress = '0xae02c7b1c324a8d94a564bc8d713df89eae441fe';
    input.gatewayConfigPath = undefined;
    input.auxiliaryChain = '1000';
    const getConfigPathSpy = sinon.replace(
      Directory,
      'getGatewayConfigPath',
      sinon.fake.returns(
        path.join(
          Directory.projectRoot,
          'tests/Config/testdata/0xae02c7b1c324a8d94a564bc8d713df89eae441fe.json',
        ),
      ),
    );
    const deploySpy = sinon.stub(SubGraph.prototype, 'deploy');

    deploySubGraph(
      input.originChain,
      input.auxiliaryChain,
      input.subgraphType,
      input.graphAdminRPC,
      input.graphIPFS,
      input.mosaicConfigPath,
      input.gatewayAddress,
      input.gatewayConfigPath,
    );

    SpyAssert.assert(getConfigPathSpy, 1, [
      [input.originChain, parseInt(input.auxiliaryChain, 10), input.gatewayAddress],
    ]);
    assert.strictEqual(
      deploySpy.callCount,
      1,
      'Deploy subgraph must be called once',
    );
  });
});
