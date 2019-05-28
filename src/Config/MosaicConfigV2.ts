import * as path from "path";
import * as fs from "fs-extra";
import Directory from "../Directory";
import Logger from "../Logger";

/**
 * Holds the config of mosaic chains of a specific origin chain.
 */
export default class MosaicConfig {
    public originChain: OriginChain;
    public auxiliaryChains: { [key: string]: AuxiliaryChain };

    constructor(config: any) {
        this.originChain = config.originChain || new OriginChain();
        this.auxiliaryChains = config.auxiliaryChains || {};
    }

    /**
     * This reads mosaic config from the json file and creates MosaicConfig object.
     * @param {string} chain Chain Identifier.
     * @return {MosaicConfig} mosaicConfig Object of the class mosaic config.
     */
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
}

/**
 * Holds origin chain specific config.
 */
class OriginChain {
    public chain: string;
    public contractAddresses: OriginLibraries;

    constructor() {
        this.contractAddresses = new OriginLibraries();
    }
}

/**
 * Holds config of a auxiliary chain.
 */
class AuxiliaryChain {
    public chainId: string;
    public bootNodes: string[];
    public genesis: Object;
    public contractAddresses: ContractAddresses;

    constructor(){
        this.bootNodes = [];
        this.contractAddresses = new ContractAddresses();
    }
}

/**
 * Hold contract addresses on origin and auxiliary chain specific to a auxiliary chain.
 */
class ContractAddresses {
    public origin: OriginContracts;
    public auxiliary: AuxiliaryContracts;

    constructor(){
        this.origin = new OriginContracts();
        this.auxiliary = new AuxiliaryContracts();
    }
}

/**
 * Hold contract addresses on origin chain independent of auxiliary chain.
 */
class OriginLibraries {
    public simpleTokenAddress: Address;
    public merklePatricialLibAddress: Address;
    public gatewayLibAddress: Address;
    public messageBusAddress: Address;
}

/**
 * Contract addresses on the origin chain specific to a auxiliary chain.
 */
class OriginContracts {
    public anchorOrganizationAddress: Address;
    public anchorAddress: Address;
    public ostGatewayOrganizationAddress: Address;
    public ostEIP20GatewayAddress: Address;
    public ostComposerAddress: Address
}

/**
 * Contract addresses on the auxiliary chain.
 */
class AuxiliaryContracts {
    public ostPrimeAddress: Address;
    public anchorOrganizationAddress: Address;
    public anchorAddress: Address;
    public merklePatriciaLibAddress: Address;
    public gatewayLibAddress: Address;
    public messageBusAddress: Address;
    public ostCoGatewayOrganizationAddress: Address;
    public ostEIP20CogatewayAddress: Address;
}

type Address = string;