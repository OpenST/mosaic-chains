#!/bin/bash

# Run this executable to build the chains from the genesis files.
# The mosaic.sh script to run mosaic will copy the initial states to ~/.mosaic.

ORIGIN=ropsten
CHAINS=(1406)

for chain in ${CHAINS[*]}
do
    echo 'Building' $ORIGIN/$chain
    echo $(pwd)/chains/${ORIGIN}/${chain}:/chain_data
    docker run -v $(pwd)/chains/${ORIGIN}/${chain}:/chain_data \
        ethereum/client-go:stable \
        --datadir /chain_data \
        init \
        /chain_data/genesis.json
done
