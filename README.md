# ⛓ Mosaic Chains

You need docker installed to run the chains.
Origin will run a parity client and auxiliary will run a go-ethereum client.

## Running mosaic

For origin, everything that parity takes as a "chain" argument is allowed.

```bash
# Usage: mosaic.sh [-d <path>] <origin> <auxiliary> <action>

# Example for ropsten as origin and 200 as auxiliary:
$ ./mosaic.sh ropsten 200 start
$ ./mosaic.sh ropsten 200 stop
```

* Origin RPC endpoint: `geth attach http://localhost:8545`
* Auxiliary RPC endpoint: `geth attach http://localhost:8546`

Example commands to access the logs:

```bash
docker logs -f mosaic-ropsten-utility_chain_200_origin_1
docker logs -f mosaic-ropsten-utility_chain_200_auxiliary_1
```

## Adding a new auxiliary chain

1. Create a new directory `./utility_chain_<id>`.
2. Add the genesis file as `./utility_chain_<id>/genesis.json`.
3. Add `<id>` to the `CHAINS` array at the beginning of `build.sh`.
4. Run `./build.sh` to generate all chain inits.
5. Add `./utility_chain_<id>/environment.sh` and add the relevant data (see other chains for examples).
