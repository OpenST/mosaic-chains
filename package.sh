#!/bin/bash

rm -rf ./lib
npm ci

./node_modules/.bin/tsc
cp -r ./utility_chains ./lib/
cp -r ./mosaic_configs ./lib/
cp ./src/Graph/docker-compose.yml ./lib/src/Graph/docker-compose.yml

