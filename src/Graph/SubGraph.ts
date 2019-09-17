import * as path from 'path';
import * as mustache from 'mustache';
import Logger from '../Logger';
import Shell from '../Shell';
import Directory from '../Directory';
import MosaicConfig from '../Config/MosaicConfig';
import GraphDescription from './GraphDescription';
import FileSystem from '../FileSystem ';

/**
 * Represents a sub graph.
 */
export default class SubGraph {
  /** The chain identifier identifies the origin chain. For example ropsten. */
  private readonly originChain: string;

  /** The chain identifier identifies the aux chain. For example 1407. */
  private readonly auxiliaryChain: string;

  /** To be used to determine which code is deployed. For example origin/auxiliary */
  private readonly subGraphType: string;

  /** Graph description to be used for this sub graph */
  private readonly graphDescription: GraphDescription;

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
   * @param {GraphDescription} graphDescription
   */
  constructor(
    originChain: string,
    auxiliaryChain: string,
    subGraphType: string,
    graphDescription: GraphDescription,
  ) {
    this.originChain = originChain;
    this.auxiliaryChain = auxiliaryChain;
    this.subGraphType = subGraphType;
    this.graphDescription = graphDescription;
  }

  /**
   * Create local instance and deploy graph.
   * @return {{success: boolean; message: string}}
   */
  public deploy(): {success: boolean; message: string} {
    if (FileSystem.pathExistsSync(this.getSubGraphProjectDir)) {
      // if subGraphProjectDir we would assume sub graph deployment was already complete
      this.logInfo('Sub graph already exists. Skipping deployment');
      return { success: true, message: 'Sub graph already exists. Skipping deployment' };
    }
    this.copyCodeToTempDir();
    this.installNodeModules();
    this.writeSubGraphConfigFile();
    const createLocalResponse = this.createLocal();
    if (!createLocalResponse.success) {
      this.deleteCodeFromTempDir();
      return createLocalResponse;
    }
    const deployLocalResponse = this.deployLocal();
    if (deployLocalResponse.success) {
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
      this.graphDescription.mosaicDir,
      this.getSubGraphProjectDirSuffix,
    );
  }

  /**
   * Directory in which we would keep auto generated graph related code temporarily.
   * @return {string}
   */
  private get getTempGraphInstallationDir(): string {
    return path.join(
      Directory.getTempGraphInstallationDir,
      this.getSubGraphProjectDirSuffix,
    );
  }

  /**
   * Suffix which is used to predict sub graph related folders.
   * @return {string}
   */
  private get getSubGraphProjectDirSuffix(): string {
    if (this.subGraphType === SubGraph.originSubGraphType) {
      return Directory.getOriginSubGraphProjectDirSuffix(this.originChain, this.auxiliaryChain);
    }
    return Directory.getAuxiliarySubGraphProjectDirSuffix(this.originChain, this.auxiliaryChain);
  }

  /**
   * Copy auto generated code to a temp dir.
   */
  private copyCodeToTempDir(): void {
    this.logInfo('copying auto generated graph code to temp directory');
    FileSystem.ensureDirSync(this.getTempGraphInstallationDir);
    FileSystem.copySync(
      Directory.getProjectAutoGenGraphDir(this.subGraphType),
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
   * @return {{success: boolean; message: string}}
   */
  private createLocal(): {success: boolean; message: string} {
    this.logInfo('attempting to create local graph');
    try {
      this.executeGraphCommand(`create --node http://localhost:${this.graphDescription.rpcAdminPort}/ ${this.name}`);
      return { success: true, message: '' };
    } catch (ex) {
      const message = this.extractMessageFromError(ex);
      this.logInfo(`create local graph failed with: ${message}`);
      return { success: false, message };
    }
  }

  /**
   * Copy auto generated code to a temp dir.
   */
  private writeSubGraphConfigFile(): void {
    this.logInfo('writing subgraph.yaml');
    const fileContentBuffer = FileSystem.readFileSync(path.join(this.getTempGraphInstallationDir, 'subgraph.yaml.mustache'));
    FileSystem.writeFileSync(
      path.join(this.getTempGraphInstallationDir, 'subgraph.yaml'),
      mustache.render(fileContentBuffer.toString(), this.templateVariables()),
    );
  }

  /**
   * Returns values for all template variables which need to be replaced in subgraph.yaml.
   */
  private templateVariables(): object {
    if (this.subGraphType === SubGraph.originSubGraphType) {
      return this.originChainTemplateVariables();
    }
    return this.auxiliaryChainTemplateVariables();
  }

  /**
   * the name of sub graph.
   * @returns The prefix.
   */
  private get name(): string {
    if (this.subGraphType === SubGraph.originSubGraphType) {
      return `mosaic/origin-${this.auxiliaryChain}`;
    }
    return `mosaic/auxiliary-${this.auxiliaryChain}`;
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
      redeemPoolAddress: auxiliaryContractAddresses.redeemPoolAddress,
    };
  }

  /**
   * Create local instance and deploy sub graph.
   * @return {{success: boolean; message: string}}
   */
  private deployLocal(): {success: boolean; message: string} {
    this.logInfo('attempting to deploy local graph');
    try {
      this.executeGraphCommand(
        `deploy --node http://localhost:${this.graphDescription.rpcAdminPort}/ --ipfs http://localhost:${this.graphDescription.ipfsPort} ${this.name}`,
      );
      return { success: true, message: '' };
    } catch (ex) {
      const message = this.extractMessageFromError(ex);
      this.logInfo(`deploy local graph failed with: ${message}`);
      this.logInfo('removing local graph');
      this.executeGraphCommand(`remove --node http://localhost:${this.graphDescription.rpcAdminPort}/ ${this.name}`);
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
    FileSystem.removeSync(this.getTempGraphInstallationDir);
  }

  /**
   * Persist auto generated code.
   */
  private copyToSubGraphProjectDir(): void {
    this.logInfo('persisting auto generated graph code');
    const subGraphProjectDir = this.getSubGraphProjectDir;
    FileSystem.ensureDirSync(subGraphProjectDir);
    FileSystem.copySync(
      this.getTempGraphInstallationDir,
      subGraphProjectDir,
    );
  }

  /**
   * Extract message from error object.
   * @param {Error} error
   * @return {string}
   */
  private extractMessageFromError(error: Error): string {
    const jsonErrorObject = JSON.parse(JSON.stringify(error));
    if (jsonErrorObject.stderr.data.length > 0) {
      return Buffer.from(jsonErrorObject.stderr.data).toString();
    }
    if (jsonErrorObject.stdout.data.length > 0) {
      return Buffer.from(jsonErrorObject.stdout.data).toString();
    }
    return 'Something went wrong';
  }

  /**
   * Logs the given message as `info`. Adds some params to the metadata of the log message.
   * @param message The message to log.
   */
  private logInfo(message: string): void {
    Logger.info(message, { auxiliaryChain: this.auxiliaryChain, subGraphType: this.subGraphType });
  }
}
