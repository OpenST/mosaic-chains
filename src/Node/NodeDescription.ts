import Directory from '../Directory';

/**
 * Describes the properties of a node.
 */
export default class NodeDescription {
  public mosaicDir: string = Directory.getDefaultMosaicDataDir;

  public port: number = 30303;

  public rpcPort: number = 8545;

  public websocketPort: number = 8645;

  public keepAfterStop: boolean = false;

  public unlock: string = '';

  public password: string = '';

  public originChain: string = '';

  public client: string = '';

  public bootNodesFile?: string;

  public clefSigner?: string;

  constructor(readonly chain: string) { }
}
