import * as path from "path";
import Directory from "../Directory";
import Logger from "../Logger";
import * as fs from "fs-extra";

/**
 * Holds the config of mosaic chains of a specific origin chain.
 */
export default class MosaicConfig {
    public originChain: OriginChain;
    public auxiliaryChains: AuxiliaryChain[];

    constructor(config: any) {
        this.originChain = config.originChain || new OriginChain();
        this.auxiliaryChains = config.auxiliaryChains || [];
    }


    /**
     * Saves this config to a file in its auxiliary chain directory.
     */
    public writeToMosaicConfigDirectory(): void {

        let mosaicConfigDir = Directory.getProjectMosaicConfigDir();
        fs.ensureDirSync(mosaicConfigDir);
        const configPath = path.join(
            mosaicConfigDir,
            `${this.originChain.chain}.json`,
        );
        Logger.info('storing mosaic config', {configPath});

        fs.writeFileSync(
            configPath,
            JSON.stringify(this, null, '    '),
        );
    }

    public static from(chain): MosaicConfig {

        const filePath = path.join(
            Directory.getProjectMosaicConfigDir(),
            `${chain}.json`,
        );
        if (fs.existsSync(filePath)) {
            let config = fs.readFileSync(filePath).toString();
            if (config && config.length > 0) {
                const jsonObject = JSON.parse(config);
                return new MosaicConfig(jsonObject);
            }
        }
        return new MosaicConfig({} as MosaicConfig);
    }
}

/**
 * Holds origin chain specific config.
 */
class OriginChain {
    public chain: string;
    public contractAddress: OriginLibraries;

    constructor() {
        this.contractAddress = new OriginLibraries();
    }

}

/**
 * Holds config of a auxiliary chain.
 */
class AuxiliaryChain {
    public chainId: string;
    public bootNodes: string[];
    public genesis: Object;
    public contractAddress: ContractAddresses;

    constructor(){
        this.bootNodes = [];
        this.contractAddress = new ContractAddresses();
    }
}

/**
 * Hold contract addresses on origin and auxiliary chain specific to a auxiliary chain.
 */
class ContractAddresses {
    public origin: OriginContract;
    public auxiliary: AuxiliaryContract;

    constructor(){
        this.origin = new OriginContract();
        this.auxiliary = new AuxiliaryContract();
    }
}

/**
 * Hold contract addresses on origin chain independent of auxiliary chain.
 */
class OriginLibraries {
    public simpleTokenAddress: string;
    public merklePatricialLibAddress: string;
    public gatewayLibAddress: string;
    public messageBusAddress: string;
}

/**
 * Contract addresses on the origin chain specific to a auxiliary chain.
 */
class OriginContract {
    public anchorOrganizationAddress: string;
    public anchorAddress: string;
    public ostGatewayOrganizationAddress: string;
    public ostEIP20GatewayAddress: string;
    public ostComposerAddress: string
}

/**
 * Contract addresses on the auxiliary chain.
 */
class AuxiliaryContract {
    public ostPrimeAddress: string;
    public anchorOrganizationAddress: string;
    public anchorAddress: string;
    public merklePatriciaLibAddress: string;
    public gatewayLibAddress: string;
    public messageBusAddress: string;
    public ostCoGatewayOrganizationAddress: string;
    public ostEIP20CogatewayAddress: string;
}
