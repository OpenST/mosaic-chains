/**
 * Describes the properties of a node.
 */
export default class NodeDescription {
  public chainId: string;
  public mosaicDir: string = '~/.mosaic';
  public port: number = 30303;
  public rpcPort: number = 8545;
  public websocketPort: number = 8645;
  public keepAfterStop: boolean = false;
  public unlock: string = '';
  public password: string = '';

  constructor(chainId: string) {
    this.chainId = chainId;
  }
}
