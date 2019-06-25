#!/bin/bash

rm -rf ./lib
npm ci

./node_modules/.bin/tsc
cp -r ./chains ./lib/
cp ./src/Graph/docker-compose.yml ./lib/src/Graph/docker-compose.yml
cp ./src/Config/MosaicConfig.schema.json ./lib/src/Config/MosaicConfig.schema.json
