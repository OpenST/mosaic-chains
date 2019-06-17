#!/bin/bash

rm -rf ./lib
npm ci

./node_modules/.bin/tsc
cp -r ./utility_chains ./lib/
cp -r ./mosaic_configs ./lib/
cp ./src/Graph/docker-compose.yml ./lib/src/Graph/docker-compose.yml
cp ./src/Config/MosaicConfig.schema.json ./lib/src/Config/MosaicConfig.schema.json
