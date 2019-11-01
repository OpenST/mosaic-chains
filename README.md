# ⛓ Mosaic Chains

You need node and docker installed to run the chains.

Mosaic will automatically identify if you want to run a geth node or a parity node based on the chain id or name.
Any string supported by parity as a network option will start a parity node container.
Any other string it tries to match to one of the available IDs in the `./chains` directory and starts the geth node.

The command to start a chain is `./mosac start <chain_id>`

if option `--origin <origin_chain>` is not provided then `chain_id` itself is the origin chain identifier, otherwise `chain_id` is auxiliary chain id.

Example:
```bash
# start orign chain.
./mosaic start ropsten

# start auxiliary chain.   
./mosac start 1406 --origin ropsten
```

Start command will also start a graph node by default and deploy a sub graph for the given chain.
The Graph is a decentralized protocol for indexing and querying data from blockchains, which makes it possible to query for data that is difficult or impossible to do directly.
To start chain without graph node use option `--withoutGraphNode` 

Stopping a container that was started with mosaic completely removes that container from the host.
Only the content in the mounted data directory remains.
If you want to keep the container around, for example to debug in the logs after it was stopped automatically after starting, use the `--keep` option of `./mosaic start`.

⚠️  Nodes started with `mosaic` open *all* available APIs. If necessary, make sure your machine is secured.

## Running mosaic

Clone `git clone git@github.com:OpenST/mosaic-chains.git` and install `npm ci`.
Run `./mosaic --help` to get the help output.
You can use the `--help` option with any sub-command to get the relevant help for that sub-command, e.g. `./mosaic start --help`.

The default directory for mosaic to store mosaic chain data is `~/.mosaic`.
You can specify a different directory with the `--mosaic-dir` option.

### Available chains

Usually, you want to run a combination of at least one origin chain with at least one matching auxiliary chain.
For example Ethereum mainnet and `1414` or Ropsten and `1406`.

* Auxiliary chains running against Ethereum mainnet:
    * `1414`
* Testnet auxiliary chains running against Ropsten:
    * `1406`
    * `1407`

The chain id of future auxiliary chains running against Ethereum mainnet will increase by one number each.
The chain id of future auxiliary chains running against Ropsten will decrease by one number each.

## Dev chains
For development, you can use the dev chains. These chains have the initial chain setup contracts deployed. 

Example:
```bash
# start origin chain.
./mosaic start dev-origin

# start auxiliary chain.   
./mosaic start dev-auxiliary
```

### Default ports

By default, a chain uses the following ports:
* port: `3<chain-id>`
* rpc: `4<chain-id>`
* ws: `5<chain-id>`

Where `<chain-id>` would always be exactly four characters, with leading zeros in case of a shorter chain id.

Examples with different chain IDs:

| Chain | Port | RPC | WS |
| ---| --- | --- | --- |
| Ropsten (`3`) | `30003` | `40003` | `50003` |
| `200` | `30200` | `40200` | `50200` |
| `1406` | `31406` | `41406` | `51406` |

## Creating a new auxiliary chain
If there is no existing mosaic config with the library addresses for the `origin` chain then first run `./mosaic libraries <origin-chain-id> <origin-websocket> <deployer-address>`. This command will create a mosaic config file for the origin chain and stores library addresses of origin chain. Generated mosaic config must be used to create multiple auxiliary chains. Ideally `./mosaic libraries` command should be used once per origin chain. This command assumes that deployer address is unlocked already.

The command to create a new auxiliary chain is `./mosaic create <new-chain-id> <origin-websocket> <password-file> --origin <origin_chain>`.
See `./mosaic create --help` for more help.

Creating a new auxiliary chain assumes that you have an unlocked account on a node that is connected to the **origin chain.**
If that is **not** the case, do one or more of the steps below as required.
You should know what you are doing here.

1. Make sure you have an origin node running. If that is not the case, start one (e.g. `./mosaic start ropsten`).
2. Attach to the node (e.g. `./mosaic attach ropsten`).
3. Create a new account (`personal.newAccount("password")`).
4. Create a `./password.txt` (or different) file that contains `password` followed by a newline.
5. Unlock the account (e.g. `./mosaic stop ropsten; ./mosaic start --unlock address --password ./password.txt ropsten`).
6. You want to lock the account again after creating the auxiliary chain has finished (e.g. `./mosaic stop ropsten; ./mosaic start ropsten`).
7. You may want to delete the password file.

Other prerequisites that you need:

* A password file with exactly two lines (followed by a newline) of the **same password.** For now, this is the only way to set up the (temporary) accounts for sealing and deploying on the new auxiliary chain.
* A websocket connection to a node that is connected to an existing origin chain. It has to have an unlocked account with sufficient balance. The account address of the unlocked account must be added to the file in the `initialize` directory (see next bullet point).
* An initial configuration file in the project's `initialize` directory. The file name has to equal the new chain ID that you want to use. You can copy the example file and fill in your values. If you want to know what the parameters mean, check the [relevant documentation in the code](src/Config/InitConfig.ts).

To see the help:

```
./mosaic create --help
```

A simple run would be the following:

```
./mosaic create 1337 ws://localhost:8746 ./password.txt --origin ropsten
```

Where:

* `1337` is the new ID of the new chain.
* `ws://localhost:8746` is the websocket connection to the running origin node with an unlocked account.
* `./password.txt` is the path to the password file that contains the **two identical passwords.**
* `ropsten` is the origin chain.

#### Stake Pool
Stake pool command deploys ost composer and organization contract on the origin chain where staker can request stake and pool of facilitators can facilitate stake and mint on behalf of staker.

```bash
./mosaic setup-stake-pool <originChain> <originWeb3EndPoint> <deployer> <organizationOwner> <organizationAdmin>
```

Where:
 * `originChain` is origin chain identifier.
 * `originWeb3EndPoint` is the web3 endpoint of the origin chain.   
 * `deployer` Address on origin chain with funds.
 * `organizationOwner` Address of organization owner of ost composer contract.
 * `organizationAdmin` Address of organization admin of ost composer contract.
 
 Example: 
 ```bash
 ./mosaic setup-stake-pool 12346  http://localhost:8545 0x0000000000000000000000000000000000000001 0x0000000000000000000000000000000000000001 0x0000000000000000000000000000000000000001
 ```

 Note: Setup stake pool command expects deployer address to be unlocked.
 
#### Redeem Pool
Redeem pool command deploys redeem pool and organization contract on the auxiliary chain where redeemer can request redeem and pool of facilitators can facilitate redeem and unstake on behalf of redeemer.

```bash
./mosaic setup-redeem-pool <originChain> <auxiliaryChain> <auxChainWeb3EndPoint> <deployer> <organizationOwner> <organizationAdmin>
```

Where:
 * `originChain` is origin chain identifier.
 * `auxiliaryChain` is auxiliary chain identifier.
 * `auxChainWeb3EndPoint` is the web3 endpoint of auxiliary chain.   
 * `deployer` Address on auxiliary chain with funds.
 * `organizationOwner` Address of organization owner of redeem pool contract.
 `* organizationAdmin` Address of organization admin of redeem pool contract.
 
 Example: 
  ```bash
 ./mosaic setup-redeem-pool 12346 500 http://localhost:40500 0x0000000000000000000000000000000000000001 0x0000000000000000000000000000000000000001 0x0000000000000000000000000000000000000001
 ```

 
 Note: Setup redeem pool command expects deployer address to be unlocked.

 
####Troubleshooting:

* When starting, you get an error that the connection is not open:
  * Make sure that the websocket you provide as an argument points to a running origin node and that your machine can connect to it.
* You get an error that your account is locked on auxiliary:
  * Make sure that the newly created auxiliary sealer doesn't use any ports that you forward to any running nodes via SSH. You can use the options `--port`, `--rpc-port`, and `--ws-port` with the `create` command to make sure you use different ports on the auxiliary sealer.
* The EVM reverts without details at the step "stake" (on origin):
  * Make sure that you set the correct OST address in you init configuration and that your origin account has sufficient funds to pay for the stake amount plus the bounty amount (on origin).
* Your machine is showing sign of slowness because of creation of auxiliary chains:
  * Too many docker containers could be running while creation of auxiliary chains with different chain ids. Make sure you stop the docker containers of auxiliary chains if it's not being used.  

*Refer integration test of mosaic-create command to understand end to end flow.*

## Subgraph deployment
Subgraph command can be used to deploy mosaic subgraph. Subgraph by [thegraph](https://thegraph.com) protocol is used to index transactions and events by mosaic smart contract. 

#### Prerequisite: 
Below commands assumes the blockchain node and graph node is already running. You can use `mosaic start` command to start a node and graph node.

##### Subgraph deployment for mosaic gateways: 
Below command deploys subgraph of mosaic gateways.

```bash
./mosaic subgraph <origin-chain-identifier> <auxiliary-chain-identifier> <chainType> <admin-graph-rpc> <graph-ipfs> 
```
**where:** 
1. origin-chain-identifier: Origin chain identifier like ropsten, goerli, dev-origin
2. auxiliary-chain-identifier: Auxiliary chain ID like 1405, 1406, 1407 or 1000(dev-auxiliary).
3. chainType: Either`origin` or `auxiliary` chain.
4. admin-graph-rpc: RPC endpoint of graph node.
5. graph-ipfs: IPFS endpoint used by graph node.

Optionally `--mosaic-config` option can be used to pass mosaic config otherwise command will search on default path.

#### Subgraph deployment for any EIP20 gateways:
Below command deploys subgraph of any eip20gateway.
```bash
./mosaic subgraph <origin-chain-identifier> <auxiliary-chain-identifier> <chain> <admin-graph-rpc> <graph-ipfs>  --gateway-config <gateway-config>
```
**where:**
1. gateway-config: Path of gateway config. 

Optionally `gateway-address` option can be passed which will search gateway config on default path.  

Subgraph deployment command also prints subgraph endpoint after execution.
## Chain Verifier

Chain verifier makes sure that newly created chain is being setup correctly.

Pre-requisites

* Origin chain should be up and running.
* Auxiliary chain should be up and running.
* MosaicConfig should be populated with contract addresses.

A simple run would be the following:

```
./mosaic verify-chain origin-websocket auxiliary-websocket originChainIdentifier auxChainIdentifier
```

* origin-websocket: Origin chain endpoint. Needed for fetching contract state variables deployed on origin chain for verification.
* auxiliary-websocket: Auxiliary chain endpoint. Needed for fetching contract state variables deployed on auxiliary chain for verification.
* originChainIdentifier: Origin chain identifier. e.g. chain name or chain id
* auxChaiIdentifier: Auxiliary chain identifier. e.g. chain id

## Adding an existing auxiliary chain

To add an existing chain, you need to know the bootnodes and `genesis.json`.
If you have those, follow the steps below:

1. Create a new directory `./chains/<origin_chain>/<chain_id>`.
2. Add the genesis file as `./chains/<origin_chain>/<chain_id>/genesis.json`.
3. Add `<chain_id>` to the `CHAINS` array at the beginning of `build.sh`.
4. Run `./build.sh` to generate all chain inits.
5. Add `./chains/<origin_chain>/<chain_id>/bootnodes` and add the boot nodes (see other chains for examples).

## Tool

 #### Whitelist worker for stakepool and redeempool. 
 
 This tool enables whitelisting of workers for stake and redeem pool contract. It expects organization admin of stakepool and redeempool contract is unlocked on the node. 
 
   *1. Set below environment variables*:
    
     
     export ORIGIN_WEB3_ENDPOINT='replace_with_origin_web3_endpoint';
     export AUXILIARY_WEB3_ENDPOINT='replace_with_auxiliary_web3_endpoint';
     export AUXILIARY_CHAIN_ID='replace_with_auxiliary_chain_id';
     export MOSAIC_CONFIG_PATH='replace_with_mosaic_config_path';
     export ORIGIN_WORKER_ADDRESS='replace_with_origin_worker_address';
     export AUXILIARY_WORKER_ADDRESS='replace_with_auxiliary_worker_address';
     export ORIGIN_WORKER_EXPIRATION_HEIGHT='replace_with_origin_expiration_height';
     export AUXILIARY_WORKER_EXPIRATION_HEIGHT='replace_with_auxiliary_expiration_height';
 
 Origin and auxiliary worker addresses are generated with `facilitator init` step. 
 Mosaic config path for supported chain should be available at `~/.mosaic/<origin-chain>/mosaic.json` where `<origin-chain>` is origin chain identifier e.g. `ropsten`.  
 
 Origin and auxiliary worker expiration height is block height from current block for which worker keys are whitelisted. 
 
 Example: If current block is 1000 and expiration height is set to 100 then worker keys will be whitelisted for 1100 block.
 
 *2. run command*:
      
      npm run whitelist-workers



## Mosaic Config: 
Mosaic config file is required in various steps and commands. There are two ways to locate mosaic config file. 

1. **On local machine**: Mosaic config is copied on local machine inside folder `~/.mosaic/<origin-chain-identifier>/mosaic.json` while starting mosaic chain. Here `<origin-chain-identifier>` can be `ropsten`, `goerli` and `dev-origin`.

2. **On github**: Mosaic config can be download for different origin chains from [github](chains).
  Mosaic config file exists inside folders [goerli](chains/goerli) and [ropsten](chains/ropsten).    
  
## Gateway config
Gateway config file is also required for various commands. This file contains information about gateway addresses. Currently below config files are supported: 

1. [WETH gateway config](chains/goerli/1405/0x6649c6ff3629ae875b91b6c1551139c9feaa2514.json).
        
## Tests

Run the tests with `npm test`.
