/**
 * Describes the properties of a node.
 */
export default class NodeDescription {
  chainId: string;
  mosaicDir: string = '~/.mosaic';
  port: number = 30303;
  rpcPort: number = 8545;
  websocketPort: number = 8645;
  keepAfterStop: boolean = false;
  unlock: string = '';
  password: string = '';

  constructor(chainId: string) {
    this.chainId = chainId;
  }
}
