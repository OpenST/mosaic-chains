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
    public contractAddresses: OriginLibraries;
}

/**
 * Holds config of a auxiliary chain.
 */
class AuxiliaryChain {
    public chainId: string;
    public bootNodes: string[];
    public genesis: Object;
    public contractAddresses: ContractAddresses;
}

/**
 * Hold contract addresses on origin and auxiliary chain specific to a auxiliary chain.
 */
class ContractAddresses {
    public origin: OriginContracts;
    public auxiliary: AuxiliaryContracts;
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