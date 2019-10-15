#!/bin/bash

rm -rf ./lib
npm ci

./node_modules/.bin/tsc
cp -r ./chains ./lib/
cp -r ./graph ./lib/
cp -r ./abi ./lib/
cp ./src/Graph/docker-compose.yml ./lib/src/Graph/docker-compose.yml
cp ./src/Config/MosaicConfig.schema.json ./lib/src/Config/MosaicConfig.schema.json
cp ./src/Config/GatewayConfig.schema.json ./lib/src/Config/GatewayConfig.schema.json
