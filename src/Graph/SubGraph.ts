import * as path from 'path';
import * as mustache from 'mustache';
import Logger from '../Logger';
import Shell from '../Shell';
import Directory from '../Directory';
import FileSystem from '../FileSystem ';
import GatewayAddresses from '../Config/GatewayAddresses';

export enum SubGraphType {
  ORIGIN = 'origin',
  AUXILIARY = 'auxiliary',
}
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

  /** Graph node rpc admin endpoint */
  private readonly graphRPCAdminEndPoint: string;

  /** Graph node IPFS endpoint */
  private readonly graphIPFSEndPoint: string;

  /** Gateway pair addresses */
  private readonly gatewayAddresses: GatewayAddresses;

  /**
   * Constructor.
   * @param originChain Origin chain identifier.
   * @param auxiliaryChain Auxiliary chain identifier.
   * @param subGraphType Subgraph type
   * @param graphRPCAdminEndPoint Graph node rpc admin endpoint.
   * @param graphIPFSEndPoint Graph node IPFS endpoint.
   * @param gatewayAddresses Gateway pair addresses.
   */
  public constructor(
    originChain: string,
    auxiliaryChain: string,
    subGraphType: string,
    graphRPCAdminEndPoint: string,
    graphIPFSEndPoint: string,
    gatewayAddresses: GatewayAddresses,
  ) {
    this.originChain = originChain;
    this.auxiliaryChain = auxiliaryChain;
    this.subGraphType = subGraphType;
    this.graphRPCAdminEndPoint = graphRPCAdminEndPoint;
    this.graphIPFSEndPoint = graphIPFSEndPoint;
    this.gatewayAddresses = gatewayAddresses;
  }

  /**
   * Create local instance and deploy graph.
   * @return
   */
  public deploy(): {success: boolean; message: string; subgraphName: string} {
    this.copyCodeToTempDir();
    this.installNodeModules();
    this.writeSubGraphConfigFile();
    const createLocalResponse = this.createLocal();
    if (!createLocalResponse.success) {
      this.deleteCodeFromTempDir();
      return {
        ...createLocalResponse,
        subgraphName: this.name,
      };
    }
    const deployLocalResponse = this.deployLocal();
    this.deleteCodeFromTempDir();
    return {
      ...deployLocalResponse,
      subgraphName: this.name,
    };
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
    if (this.subGraphType === SubGraphType.ORIGIN
    ) {
      return Directory.getOriginSubGraphProjectDirSuffix(
        this.originChain,
        this.auxiliaryChain,
      );
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
    Shell.executeInShell(`cd ${this.getTempGraphInstallationDir} && npm ci`);
  }

  /**
   * Create local sub graph. This would fail if sub graph was already registered.
   * @return
   */
  private createLocal(): {success: boolean; message: string} {
    this.logInfo('attempting to create local graph');
    try {
      this.tryRemovingSubgraph();
      this.executeGraphCommand(`create --node ${this.graphRPCAdminEndPoint}/ ${this.name}`);
      return { success: true, message: '' };
    } catch (ex) {
      const message = this.extractMessageFromError(ex);
      this.logInfo(`create local graph failed with: ${message}`);
      return { success: false, message };
    }
  }

  /**
   * This method tries to remove the subgraph if already deployed.
   */
  private tryRemovingSubgraph() {
    try {
      this.executeGraphCommand(`remove --node ${this.graphRPCAdminEndPoint}/ ${this.name}`);
    } catch (e) {
      this.logInfo('No subgraph exists, deploying for the first time.');
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
    if (this.subGraphType === SubGraphType.ORIGIN) {
      return this.originChainTemplateVariables();
    }
    return this.auxiliaryChainTemplateVariables();
  }

  /**
   * the name of sub graph.
   * @returns The prefix.
   */
  private get name(): string {
    if (this.subGraphType === SubGraphType.ORIGIN) {
      return `mosaic/origin-${this.gatewayAddresses.eip20GatewayAddress.substr(2, 25)}`;
    }
    return `mosaic/auxiliary-${this.gatewayAddresses.eip20CoGatewayAddress.substr(2, 22)}`;
  }

  /**
   * Returns values for all template variables which need to be replaced in
   * subgraph.yaml for origin subGraphType.
   */
  private originChainTemplateVariables(): object {
    return {
      projectRoot: Directory.projectRoot,
      stakePoolAddress: this.gatewayAddresses.stakePoolAddress,
      eip20GatewayAddress: this.gatewayAddresses.eip20GatewayAddress,
      anchorAddress: this.gatewayAddresses.anchorAddress,
    };
  }

  /**
   * Returns values for all template variables which need to be replaced in
   * subgraph.yaml for auxiliary subGraphType.
   */
  private auxiliaryChainTemplateVariables(): object {
    return {
      projectRoot: Directory.projectRoot,
      anchorAddress: this.gatewayAddresses.coAnchorAddress,
      eip20CoGatewayAddress: this.gatewayAddresses.eip20CoGatewayAddress,
      redeemPoolAddress: this.gatewayAddresses.redeemPoolAddress,
    };
  }

  /**
   * Create local instance and deploy sub graph.
   * @return
   */
  private deployLocal(): {success: boolean; message: string} {
    this.logInfo('attempting to deploy local graph');
    try {
      this.executeGraphCommand(
        `deploy --node ${this.graphRPCAdminEndPoint}/ --ipfs ${this.graphIPFSEndPoint} ${this.name}`,
      );
      return { success: true, message: '' };
    } catch (ex) {
      const message = this.extractMessageFromError(ex);
      this.logInfo(`deploy local graph failed with: ${message}`);
      this.logInfo('removing local graph');
      this.executeGraphCommand(`remove --node ${this.graphRPCAdminEndPoint}/ ${this.name}`);
      return { success: false, message };
    }
  }

  /**
   * Execute graph command.
   * @param commandSuffix
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
   * Extract message from error object.
   * @param error
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
