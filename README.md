# Chains Utils for OpenST Mosaic

Configuration files for building utility chain docker images and running utility chains.
Each directory includes a Dockerfile and other required files to build the docker image for a specific node.

Note the different ports that the different nodes require.

## Example files and helper scripts

The root directory contains an example `docker-compose.yml` that you can use to run a mosaic set-up.
Adapt it to your needs.

You can run the example file to run a rinkeby and a utility chain 1409 node plus a rust mosaic node that connects to the two geth nodes:
```
docker-compose --project-name mosaic up
```

The root directory contains a `geth-compose.sh` script to manage creating geth node containers and side-loading chain data.
Run `./geth-compose.sh help` for help on how to use it.

## Utility nodes

### Utility chain 1409
To run a node that connects to the 1409 utility chain, you can run:
```
docker run -it -v utility1409:/usr/utility_node -p 8547:8547 -p 8548:8548 -p 30304:30304 openstfoundation/utility-node:latest-uc1409
```

Note that `8547` is the default RPC port and `8548` is the default ws port for the utility chain 1409 image.
You can override the command to specify different ports.
See the Dockerfile for the default command, including the boot nodes.
