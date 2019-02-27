#!/bin/bash

# Run this executable to build the chains from the genesis files.
# The mosaic.sh script to run mosaic will copy the initial states to ~/.mosaic.

CHAINS=(1409 200)

for chain in ${CHAINS[*]}
do
    echo "Building" $chain
    docker run -v $(pwd)/utility_chain_${chain}:/chain_data \
        ethereum/client-go \
        --datadir /chain_data \
        init \
        /chain_data/genesis.json
done
