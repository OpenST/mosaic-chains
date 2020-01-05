import Directory from '../Directory';

/**
 * Describes the properties of a graph.
 */
export default class GraphDescription {
  public mosaicDir: string = Directory.getDefaultMosaicDataDir;

  public ethereumRpcPort: number = 8545;

  public rpcPort: number = 8000;

  public websocketPort: number = 8001;

  public rpcAdminPort: number = 8020;

  public ipfsPort: number = 5001;

  public postgresPort: number = 5432;

  public postgresUser: string;

  public postgresPassword: string;

  public postgresDatabase: string;

  public keepAfterStop: boolean = false;

  public ethereumClient: string;

  public originChain?: string;

  constructor(readonly chain: string) { }
}
