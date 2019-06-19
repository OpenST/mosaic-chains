const waitPort = require('wait-port');

import GraphDescription from "./GraphDescription";
import Graph from "./Graph";
import DeploySubGraph from "./DeploySubGraph";
import MosaicConfig from "../Config/MosaicConfig";
import Logger from "../Logger";

/**
 * Has logic to start graph node and deploy sub graphs (if required)
 */
export default class GraphStart {
  /** This chain identifier identifies the origin chain. For example ropsten. */
  private readonly originChain: string;

  /** This chain identifier identifies the aux chain. For example 1407. */
  private readonly auxiliaryChain: string;

  /** graph description to be used for starting graph node. */
  private readonly graphDescription: GraphDescription;

  /**
   *
   * @param {GraphDescription} graphDescription
   * @param {String} originChain : origin chain identifier
   * @param {String} [auxiliaryChain] : auxiliary chain identifier (to be passed only if called for an auxiliary chain)
   */
  public constructor(graphDescription: GraphDescription, originChain: string, auxiliaryChain: string) {
    this.graphDescription = graphDescription;
    this.originChain = originChain;
    this.auxiliaryChain = auxiliaryChain;

    this.deploySubGraphs = this.deploySubGraphs.bind(this);
  }

  /**
   * Start graph node
   * @return {Promise<any>}
   */
  public start(): Promise<any> {
    const graph = new Graph(this.graphDescription);
    graph.start();

    return this.deploySubGraphs();
  }

  /**
   * Deploy sub graphs
   * @return {Promise<any>}
   */
  private deploySubGraphs(): Promise<any> {
    const waitForWebsocketPort = waitPort({ port: this.graphDescription.websocketPort, output: 'silent' });
    const waitForRpcAdminPort = waitPort({ port: this.graphDescription.rpcAdminPort, output: 'silent' });
    const waitForRpcPort = waitPort({ port: this.graphDescription.rpcPort, output: 'silent' });
    const waitForPostgresPort = waitPort({ port: this.graphDescription.postgresPort, output: 'silent' });
    const waitForIpfsPort = waitPort({ port: this.graphDescription.ipfsPort, output: 'silent' });

    return Promise.all([waitForWebsocketPort, waitForRpcAdminPort, waitForRpcPort,
      waitForPostgresPort, waitForIpfsPort])
      .then(() =>
        // even after the ports are available the nodes need a bit of time to get online
        new Promise(resolve => setTimeout(resolve, 10000)))
      .then(() => {
        if (this.auxiliaryChain) {
          return this.deployAuxiliarySubGraph();
        } else {
          return this.deployOriginSubGraphs();
        }
      });
  }

  /**
   * deploy sub graphs with SubGraphType=origin for all auxiliary chains
   * @return {Promise<any>}
   */
  private deployOriginSubGraphs(): void {
    const subGraphType = DeploySubGraph.originSubGraphType;
    const mosaicConfig: MosaicConfig = MosaicConfig.fromChain(this.originChain);
    for (const auxiliaryChain of Object.keys(mosaicConfig.auxiliaryChains)) {
      Logger.info(`Starting Sub Graph Deployment for originChain: ${this.originChain} auxiliaryChain: ${auxiliaryChain} subGraphType: ${subGraphType}`);
      const deploySubGraph = new DeploySubGraph(
        this.originChain,
        auxiliaryChain,
        subGraphType,
        this.graphDescription.mosaicDir,
        this.graphDescription.rpcAdminPort,
        this.graphDescription.ipfsPort,
      );
      deploySubGraph.start();
    }
  }

  /**
   *
   * @return {Promise<any>}
   */
  private deployAuxiliarySubGraph(): void {
    const subGraphType = DeploySubGraph.auxiliarySubGraphType;
    Logger.info(`Starting Sub Graph Deployment for originChain: ${this.originChain} auxiliaryChain: ${this.auxiliaryChain} subGraphType: ${subGraphType}`);
    const deploySubGraph = new DeploySubGraph(
      this.originChain,
      this.auxiliaryChain,
      subGraphType,
      this.graphDescription.mosaicDir,
      this.graphDescription.rpcAdminPort,
      this.graphDescription.ipfsPort,
    );
    deploySubGraph.start();
  }
}
