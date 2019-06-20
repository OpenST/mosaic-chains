import GraphDescription from './GraphDescription';
import SubGraph from './SubGraph';
import MosaicConfig from '../Config/MosaicConfig';
import Logger from '../Logger';

/**
 * Has logic to determine list of sub graphs and deploy them (if required)
 */
export default class SubGraphDeployer {
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
  }

  /**
   * Start graph node
   * @return {Promise<any>}
   */
  public deploy(): void {
    if (this.auxiliaryChain) {
      return this.deployAuxiliarySubGraph();
    }
    return this.deployOriginSubGraphs();
  }

  /**
   * deploy sub graphs with SubGraphType=origin for all auxiliary chains
   * @return {Promise<any>}
   */
  private deployOriginSubGraphs(): void {
    const subGraphType = SubGraph.originSubGraphType;
    const mosaicConfig: MosaicConfig = MosaicConfig.fromChain(this.originChain);
    for (const auxiliaryChain of Object.keys(mosaicConfig.auxiliaryChains)) {
      Logger.info(`Starting Sub Graph Deployment for originChain: ${this.originChain} auxiliaryChain: ${auxiliaryChain} subGraphType: ${subGraphType}`);
      const subGraph = new SubGraph(
        this.originChain,
        auxiliaryChain,
        subGraphType,
        this.graphDescription,
      );
      subGraph.deploy();
    }
  }

  /**
   *
   * @return {Promise<any>}
   */
  private deployAuxiliarySubGraph(): void {
    const subGraphType = SubGraph.auxiliarySubGraphType;
    Logger.info(`Starting Sub Graph Deployment for originChain: ${this.originChain} auxiliaryChain: ${this.auxiliaryChain} subGraphType: ${subGraphType}`);
    const subGraph = new SubGraph(
      this.originChain,
      this.auxiliaryChain,
      subGraphType,
      this.graphDescription,
    );
    subGraph.deploy();
  }
}
