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
See the Dockerfile for the default command, including the boot nodes:
```
docker run -it -v utility1409:/usr/utility_node -p 8547:8547 -p 8548:8548 -p 30304:30304 openstfoundation/utility-node:latest-uc1409 --networkid 1409 --datadir ./uc_node --port 30304 --rpc --rpcapi eth,net,web3,personal --rpcport 8547 --ws --wsport 8548 --bootnodes enode://a4a27ee96b770d2ae801c04ac32ac494e222e0b40442b0e8400a762e5097658c47d4f66530a1459c17847215315e7dab1d99481e99cfbe9988a1bf02c2083b2e@35.173.117.179:30301,enode://08a5d0bcff92d06a8c1f7acef47d37610ffc0fb5146b693111b73656e0e2001c522971124eb8321687dcf21edd87dcf04d20276c9153ce5d045f075337c362c7@35.172.92.122:30301
```

⚠️ If you want to access the ethereum node, you need to enable access from the host [as per the go-ethereum documentation](https://hub.docker.com/r/ethereum/client-go/).
You can do that for example by adding `--rpcaddr 0.0.0.0`, if you want to access RPC from other containers and/or hosts:
```
docker run -it -v utility1409:/usr/utility_node -p 8547:8547 -p 8548:8548 -p 30304:30304 openstfoundation/utility-node:latest-uc1409 --networkid 1409 --datadir ./uc_node --port 30304 --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,personal --rpcport 8547 --ws --wsport 8548 --bootnodes enode://a4a27ee96b770d2ae801c04ac32ac494e222e0b40442b0e8400a762e5097658c47d4f66530a1459c17847215315e7dab1d99481e99cfbe9988a1bf02c2083b2e@35.173.117.179:30301,enode://08a5d0bcff92d06a8c1f7acef47d37610ffc0fb5146b693111b73656e0e2001c522971124eb8321687dcf21edd87dcf04d20276c9153ce5d045f075337c362c7@35.172.92.122:30301
```
