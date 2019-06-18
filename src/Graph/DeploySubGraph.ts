import * as path from 'path';
import * as fs from 'fs-extra';
import * as mustache from 'mustache';
import Logger from '../Logger';
import Shell from '../Shell';
import Directory from '../Directory';
import MosaicConfig from '../Config/MosaicConfig';

/**
 * Represents a graph that is managed by docker.
 */
export default class DeploySubGraph {
  /** The chain identifier identifies the origin chain. For example ropsten. */
  private readonly originChain: string;

  /** The chain identifier identifies the aux chain. For example 1407. */
  private readonly auxiliaryChain: string;

  /** The mosaic directory to use which holds the chains' subdirectories. */
  private readonly mosaicDir: string;

  /** To be used to determine which code is deployed. For example origin/auxiliary */
  private readonly subGraphType: string;

  /** The endpoint to be used for calling Admin methods over RPC */
  private readonly adminRpcPort: number;

  /** The endpoint to be used for calling methods over IPFS */
  private readonly ipfsPort: number;

  /**
   * enum defining origin sub graph type.
   * @returns The prefix.
   */
  public static get originSubGraphType(): string {
    return 'origin';
  }

  /**
   * enum defining auxiliary sub graph type.
   * @returns The prefix.
   */
  public static get auxiliarySubGraphType(): string {
    return 'auxiliary';
  }

  /**
   * Constructor.
   * @param {string} originChain
   * @param {string} auxiliaryChain
   * @param {string} subGraphType
   * @param {string} mosaicDir
   * @param {number} adminRpcPort
   * @param {number} ipfsPort
   */
  constructor(
    originChain: string,
    auxiliaryChain: string,
    subGraphType: string,
    mosaicDir: string,
    adminRpcPort: number,
    ipfsPort: number
  ) {
    this.originChain = originChain;
    this.auxiliaryChain = auxiliaryChain;
    this.mosaicDir = mosaicDir;
    this.subGraphType = subGraphType;
    this.adminRpcPort = adminRpcPort;
    this.ipfsPort = ipfsPort;
  }

  /**
   * Create local instance and deploy graph.
   * @return {object}
   */
  public start(): object {
    if (fs.pathExistsSync(this.getSubGraphProjectDir)) {
      // if subGraphProjectDir we would assume sub graph deployment was already complete
      this.logInfo(`Sub graph already exists. Skipping deployment`);
      return;
    }
    this.copyCodeToTempDir();
    this.installNodeModules();
    this.writeSubGraphConfigFile();
    const createLocalResponse: object = this.createLocal();
    if (!createLocalResponse['success']) {
      this.deleteCodeFromTempDir();
      return createLocalResponse;
    }
    const deployLocalResponse = this.deployLocal();
    if (deployLocalResponse['success']) {
      this.copyToSubGraphProjectDir();
    }
    this.deleteCodeFromTempDir();
    return deployLocalResponse;
  }

  /**
   * Directory in which we would persist code which was used for sub graph deployment.
   * @return {string}
   */
  private get getSubGraphProjectDir(): string {
    return path.join(
      this.mosaicDir,
      this.getSubGraphProjectDirSuffix
    );
  }

  /**
   * Directory in which we would keep auto generated graph related code temporarily.
   * @return {string}
   */
  private get getTempGraphInstallationDir(): string {
    return path.join(
      Directory.getTempGraphInstallationDir,
      this.getSubGraphProjectDirSuffix
    );
  }

  /**
   * Suffix which is used to predict sub graph related folders
   * @return {string}
   */
  private get getSubGraphProjectDirSuffix(): string {
    if (this.subGraphType === DeploySubGraph.originSubGraphType) {
      return path.join(
        this.originChain,
        'subgraph',
        this.auxiliaryChain,
      );
    } else if (this.subGraphType === DeploySubGraph.auxiliarySubGraphType) {
      return path.join(
        this.auxiliaryChain,
        'subgraph',
      );
    }
  }

  /**
   * Copy auto generated code to a temp dir.
   */
  private copyCodeToTempDir(): void {
    this.logInfo('copying auto generated graph code to temp directory');
    fs.ensureDirSync(this.getTempGraphInstallationDir);
    fs.copySync(
      path.join(
        Directory.projectRoot,
        'graph',
        this.subGraphType,
      ),
      this.getTempGraphInstallationDir,
    );
  }

  /**
   * Install node modules.
   */
  private installNodeModules(): void {
    this.logInfo('installing node modules');
    Shell.executeInShell(`cd ${this.getTempGraphInstallationDir} && npm install`);
  }

  /**
   * Create local sub graph. This would fail if sub graph was already registered.
   */
  private createLocal(): object {
    this.logInfo('attempting to create local graph');
    try {
      this.executeGraphCommand(`create --node http://localhost:${this.adminRpcPort}/ ${this.subGraphName}`);
      return { success: true };
    } catch (ex) {
      const { message } = ex;
      this.logInfo(`create local graph failed with: ${message}`);
      return { success: false, message };
    }
  }

  /**
   * Copy auto generated code to a temp dir.
   */
  private writeSubGraphConfigFile(): void {
    this.logInfo('writing subgraph.yaml');
    const fileContentBuffer = fs.readFileSync(path.join(this.getTempGraphInstallationDir, 'subgraph.yaml.mustache'));
    fs.writeFileSync(
      path.join(this.getTempGraphInstallationDir, 'subgraph.yaml'),
      mustache.render(fileContentBuffer.toString(), this.templateVariables()),
    );
  }

  /**
   * Returns values for all template variables which need to be replaced in subgraph.yaml.
   */
  private templateVariables(): object {
    if (this.subGraphType === DeploySubGraph.originSubGraphType) {
      return this.originChainTemplateVariables();
    } else if (this.subGraphType === DeploySubGraph.auxiliarySubGraphType) {
      return this.auxiliaryChainTemplateVariables();
    }
  }

  /**
   * the name of sub graph.
   * @returns The prefix.
   */
  private get subGraphName(): string {
    if (this.subGraphType === DeploySubGraph.originSubGraphType) {
      return `mosaic/origin-${this.auxiliaryChain}`;
    } else if (this.subGraphType === DeploySubGraph.auxiliarySubGraphType) {
      return `mosaic/auxiliary-${this.auxiliaryChain}`;
    }
  }

  /**
   * Returns values for all template variables which need to be replaced in subgraph.yaml for origin subGraphType
   */
  private originChainTemplateVariables(): object {
    const mosaicConfig: MosaicConfig = MosaicConfig.fromChain(this.originChain);
    return {
      projectRoot: Directory.projectRoot,
      ostComposerAddress: mosaicConfig.originChain.contractAddresses.ostComposerAddress,
      eip20GatewayAddress: mosaicConfig.auxiliaryChains[this.auxiliaryChain].contractAddresses.origin.ostEIP20GatewayAddress,
    };
  }

  /**
   * Returns values for all template variables which need to be replaced in subgraph.yaml for auxiliary subGraphType
   */
  private auxiliaryChainTemplateVariables(): object {
    const mosaicConfig: MosaicConfig = MosaicConfig.fromChain(this.originChain);
    const auxiliaryContractAddresses = mosaicConfig.auxiliaryChains[this.auxiliaryChain].contractAddresses.auxiliary;
    return {
      projectRoot: Directory.projectRoot,
      anchorAddress: auxiliaryContractAddresses.anchorAddress,
      eip20CoGatewayAddress: auxiliaryContractAddresses.ostEIP20CogatewayAddress,
    };
  }

  /**
   * Create local instance and deploy sub graph.
   */
  private deployLocal(): object {
    this.logInfo('attempting to deploy local graph');
    try {
      this.executeGraphCommand(
        `deploy --node http://localhost:${this.adminRpcPort}/ --ipfs http://localhost:${this.ipfsPort} ${this.subGraphName}`
      );
      return { success: true };
    } catch (ex) {
      const { message } = ex;
      this.logInfo(`deploy local graph failed with: ${message}`);
      this.logInfo('removing local graph');
      this.executeGraphCommand(`remove --node http://localhost:${this.adminRpcPort}/ ${this.subGraphName}`);
      return { success: false, message };
    }
  }

  /**
   * Execute graph command.
   * @param {string} commandSuffix
   */
  private executeGraphCommand(commandSuffix: string): void {
    Shell.executeInShell(`cd ${this.getTempGraphInstallationDir} && ./node_modules/.bin/graph ${commandSuffix}`);
  }

  /**
   * Create local instance and deploy graph.
   */
  private deleteCodeFromTempDir(): void {
    this.logInfo('deleting auto generated code from temp directory');
    fs.removeSync(this.getTempGraphInstallationDir);
  }

  /**
   * Persist auto generated code.
   */
  private copyToSubGraphProjectDir(): void {
    this.logInfo('persisting auto generated graph code');
    const subGraphProjectDir = this.getSubGraphProjectDir;
    fs.ensureDirSync(subGraphProjectDir);
    fs.copySync(
      this.getTempGraphInstallationDir,
      subGraphProjectDir,
    );
  }

  /**
   * Logs the given message as `info`. Adds some params to the metadata of the log message.
   * @param message The message to log.
   */
  private logInfo(message: string): void {
    Logger.info(message, { auxiliaryChain: this.auxiliaryChain, subGraphType: this.subGraphType });
  }
}
