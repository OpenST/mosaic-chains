# ⛓ Mosaic Chains

You need node and docker installed to run the chains.

Mosaic will automatically identify if you want to run a geth node or a parity node based on the chain id or name.
Any string supported by parity as a network option will start a parity node container.
Any other string it tries to match to one of the available IDs in the `./utility_chains` directory.
For example, it would match `1406` to `./utility_chains/utility_chain_1406`.

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

The command to create a new auxiliary chain is `./mosaic create <new-chain-id> <origin-websocket> <password-file>`.
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
* An initial configuration file in the project's `initialize` directory. The file name has to equal the new chain ID that you want to use. You can copy the example file and fill in your values. If you want to know what the parameters mean, check the [relevant documentation in the code](./src/Config/InitConfig.ts).

To see the help:

```
./mosaic create --help
```

A simple run would be the following:

```
./mosaic create 1337 ws://localhost:8746 ./password.txt
```

Where:

* `1337` is the new ID of the new chain.
* `ws://localhost:8746` is the websocket connection to the running origin node with an unlocked account.
* `./password.txt` is the path to the password file that contains the **two identical passwords.**

Troubleshooting:

* When starting, you get an error that the connection is not open:
  * Make sure that the websocket you provide as an argument points to a running origin node and that your machine can connect to it.
* You get an error that your account is locked on auxiliary:
  * Make sure that the newly created auxiliary sealer doesn't use any ports that you forward to any running nodes via SSH. You can use the options `--port`, `--rpc-port`, and `--ws-port` with the `create` command to make sure you use different ports on the auxiliary sealer.
* The EVM reverts without details at the step "stake" (on origin):
  * Make sure that you set the correct OST address in you init configuration and that your origin account has sufficient funds to pay for the stake amount plus the bounty amount (on origin).
* Your machine is showing sign of slowness because of creation of auxiliary chains:
  * Too many docker containers could be running while creation of auxiliary chains with different chain ids. Make sure you stop the docker containers of auxiliary chains if it's not being used.  

## Adding an existing auxiliary chain

To add an existing chain, you need to know the bootnodes and `genesis.json`.
If you have those, follow the steps below:

1. Create a new directory `./utility_chains/utility_chain_<id>`.
2. Add the genesis file as `./utility_chains/utility_chain_<id>/genesis.json`.
3. Add `<id>` to the `CHAINS` array at the beginning of `build.sh`.
4. Run `./build.sh` to generate all chain inits.
5. Add `./utility_chains/utility_chain_<id>/bootnodes` and add the boot nodes (see other chains for examples).

## Tests

Run the tests with `npm test`.
