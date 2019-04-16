# ⛓ Mosaic Chains

You need node and docker installed to run the chains.

Mosaic will automatically identify if you want to run a geth node or a parity node based on the chain id.
Any string supported by parity as a network option will start a parity node container.
Any other string it tries to match to one of the available IDs in the `./utility_chains` directory, e.g. `1406`.

The default ports published with docker on the host are starting from:

* port: `30303`
* RPC: `8545`
* Websocket: `8646`

When you start more than one chain, mosaic will increase all port numbers by 1 for each subsequent chain.
If you already have containers or other services running at the default host ports for publishing, use the `-port`, `-rpc-port`, and/or `-ws-port` options to start at a different port number.

Stopping a container that was started with mosaic completely removes that container from the host.
Only the content in the mounted data directory remains.
If you want to keep the container around, for example to debug in the logs after it was stopped automatically after starting, use the `--keep` option of `./mosaic start`.

⚠️ Nodes started with `mosaic` open *all* available APIs. If necessary, make sure your machine is secured.

## Running mosaic

Clone `git clone git@github.com:OpenST/mosaic-chains.git` and install `npm install`.
Run `./mosaic` to get the help output.

The default directory for mosaic to store chain data is `~/.mosaic`.
You can specify a different directory with the `--mosaic-dir` option.

Examples:
* Starts five containers to follow these chains:
  * `./mosaic start ropsten 1406 1407 1414`
 
* Stops four containers of these chains:
  * `./mosaic stop ropsten 1406 1407 1414`

* Uses /external to store the chains data:
  * `./mosaic -d /external start 1406`

* Attaches a geth node to the given chain:
  * `./mosaic attach ropsten`

* Follows the logs of a given chain:
  * `./mosaic logs ropsten`

* Lists all running mosaic chain containers:
  * `./mosaic list`
  
## Available chains
```
1406, 1407 - Testnet auxiliary chains.
1414 - Production auxiliary chain.
```
  

## Creating a new auxiliary chain

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

## Tests

Run the tests with `npm test`.

<!-- TODO: delete below!
## Adding a new auxiliary chain

1. Create a new directory `./utility_chains/utility_chain_<id>`.
2. Add the genesis file as `./utility_chains/utility_chain_<id>/genesis.json`.
3. Add `<id>` to the `CHAINS` array at the beginning of `build.sh`.
4. Run `./build.sh` to generate all chain inits.
5. Add `./utility_chains/utility_chain_<id>/environment.json` and add the relevant data (see other chains for examples).
-->
