import 'mocha';
import { assert } from 'chai';
import FileSystem from '../../src/FileSystem ';

describe('FileSystem.resolveHomeDirectory()', () => {
  it('Should resolve home path', async () => {
    const unresolvedHomePath = '~/.mosaic/goerli/mosaic.json';
    const filePath = FileSystem.resolveHomePath(unresolvedHomePath);
    const expectedFilePath = `${process.env.HOME}/.mosaic/goerli/mosaic.json`;
    assert.strictEqual(
      filePath,
      expectedFilePath,
      'Expected resolved file path is not equal to actual file path',
    );
  });

  it('Should return correct path if path does not have tilde', async () => {
    const unresolvedHomePath = '/user/.mosaic/goerli/mosaic.json';
    const filePath = FileSystem.resolveHomePath(unresolvedHomePath);
    const expectedFilePath = '/user/.mosaic/goerli/mosaic.json';
    assert.strictEqual(
      filePath,
      expectedFilePath,
      'Expected resolved file path is not equal to actual file path',
    );
  });
});
