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

    constructor(){
        this.originChain = new OriginChain();
        this.auxiliaryChains = [];
    }


    /**
     * Saves this config to a file in its auxiliary chain directory.
     */
    public writeToMosaicConfigDirectory(): void {
        const configPath = path.join(
            Directory.getProjectMosaicConfigDir(),
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
