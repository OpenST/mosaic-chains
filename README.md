# ⛓ Mosaic Chains

You need docker installed to run the chains.

Mosaic will automatically identify if you want to run a utility chain (geth) or ethereum mainnet/testnet (parity).

When you start more than one container, mosaic will increase the port numbers for docker publish with every next chain.
If you already have containers or other services running at the default host ports for publishing, use the `-p` and/or `-r` options to start at a different port number.

Stopping a container that was started with mosaic completely removes that container from the host.
Only the content in the mounted data directory remains.

## Running mosaic

Usage: `mosaic.sh [options] <command> <chains>`

Commands:
* `start <chains...>`
* `stop <chains...>`
* `attach <chain>`
* `logs <chain>`

Options:
* `-d, --data-dir <path>`:  a path to a directory where the chain data will be stored
* `-p, --port <port>    `:  the first port to use for forwarding from host to container
* `-r, --rpc-port <port>`:  the first RPC port to use for forwarding from host to container

Examples:
* Starts three containers to follow these chains:
  * `./mosaic start 200 ropsten rinkeby`

* Uses /external to store the chain data:
  * `./mosaic -d /external start 200`

* Attaches a geth node to the given chain:
  * `./mosaic attach ropsten`

* Follows the logs of a given chain:
  * `./mosaic logs ropsten`

## Adding a new auxiliary chain

1. Create a new directory `./utility_chain_<id>`.
2. Add the genesis file as `./utility_chain_<id>/genesis.json`.
3. Add `<id>` to the `CHAINS` array at the beginning of `build.sh`.
4. Run `./build.sh` to generate all chain inits.
5. Add `./utility_chain_<id>/environment.sh` and add the relevant data (see other chains for examples).
