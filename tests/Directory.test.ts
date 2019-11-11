import 'mocha';
import { assert } from 'chai';
import * as os from 'os';
import * as path from 'path';
import Directory from '../src/Directory';

describe('Directory.projectRoot', () => {
  it('returns the correct root of the project', () => {
    assert.strictEqual(
      Directory.projectRoot,
      path.join(
        __dirname,
        '..',
      ),
      'Project root is not set to the actual root of this project.',
    );
  });
});

describe('Directory.sanitize()', () => {
  it('replaces tilde with the home directory', () => {
    assert.strictEqual(
      Directory.sanitize('~/test/other'),
      path.join(
        os.homedir(),
        'test',
        'other',
      ),
      'Directory does not correctly replace the tilde with the home directory.',
    );
  });

  it('converts relative to absolute path', () => {
    assert.strictEqual(
      Directory.sanitize('./some/path'),
      path.join(
        Directory.projectRoot,
        'some',
        'path',
      ),
      'Does not properly replace `.` with the project root.',
    );

    assert.strictEqual(
      Directory.sanitize('other/path'),
      path.join(
        Directory.projectRoot,
        'other',
        'path',
      ),
      'Does not properly add project root before a relative path.',
    );
  });

  it('Returns full path of GatewayConfig', () => {
    const originChain = 'dev';
    const auxChainId = 1000;
    const gatewayAddress = '0xae02c7b1c324a8d94a564bc8d713df89eae441fe';
    const expectedPath = `${Directory.getDefaultMosaicDataDir}/dev/1000/gateway-0xaE02C7b1C324A8D94A564bC8d713Df89eae441fe/gateway-config.json`;
    const fullPath = Directory.getGatewayConfigPath(
      originChain,
      auxChainId,
      gatewayAddress,
    );
    assert.strictEqual(
      fullPath,
      expectedPath,
      `Path: ${fullPath} is not equal to expectedPath: ${expectedPath}`,
    );
  });
});

describe('Directory.getProjectChainsDirectory()', () => {
  it('should return project chain directory', () => {
    const projectChainsDirectory = Directory.getProjectChainsDirectory;

    assert.strictEqual(
      projectChainsDirectory,
      path.join(
        Directory.projectRoot,
        'chains',
      ),
      'Expected project chain directory doesnot match',
    );
  });
});
