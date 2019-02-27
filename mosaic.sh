#!/bin/bash

function help() {
  echo "Usage: mosaic.sh [-d <path>] <origin> <auxiliary> <action>"
  echo ""
  echo "mosaic.sh is a script to run mosaic chain nodes."
  echo ""
  echo "Arguments:"
  echo "  origin     the name of the origin chain, e.g. 'rinkeby'"
  echo "  auxiliary  the name of the auxiliary chain, e.g. '200'"
  echo "  action     'start' or 'stop' to start or stop the nodes"
  echo ""
  echo "Options:"
  echo "  -d, --data-dir <path>  a path to a directory where the chain data will be stored"
}

# Defaults:
DATA_DIR=~/.mosaic

# Checking input:
POSITIONAL=()
while [[ $# -gt 0 ]]
do
key="$1"

case $key in
  -h|--help)
    help
    exit 0
    ;;
  -d|--data-dir)
    DATA_DIR=${2%/} # removes trailing slash if exists
    shift # past argument
    shift # past value
    ;;
  *)    # unknown option
    POSITIONAL+=("$1") # save it in an array for later
    shift # past argument
    ;;
esac
done
set -- "${POSITIONAL[@]}" # restore positional parameters

if [ "$3" != "start" ] && [ "$3" != "stop" ]; then
  echo "ERROR: '$3' is not a valid action. Valid are 'start' and 'stop'."
  echo ""
  help
  exit 1
fi

# Setting env variables to be available in docker compose:
export DATA_DIR=$DATA_DIR
export ORIGIN=$1

source utility_chain_$2/environment.sh

# Copying initial data to ~/.mosaic if non-existant:
echo "data dir:  $DATA_DIR"
echo "origin:    $1"
echo "auxiliary: $2"

if [ ! -d $DATA_DIR ]; then
  echo "$DATA_DIR does not exist; initializing."
  mkdir $DATA_DIR
fi

if [ ! -d $DATA_DIR/$1 ]; then
  echo "$DATA_DIR/$1 does not exist; initializing."
  mkdir $DATA_DIR/$1
fi

if [ ! -d $DATA_DIR/utility_chain_$2 ]; then
  echo "$DATA_DIR/utility_chain_$2 does not exist; initializing."
  mkdir $DATA_DIR/utility_chain_$2
  cp -r ./utility_chain_$2/geth $DATA_DIR/utility_chain_$2/
fi

# Starting or stop chain nodes with docker compose:
if [ "$3" = "start" ]; then
  docker-compose --project-name mosaic-${ORIGIN}-${AUXILIARY_NAME} up -d
elif [ "$3" = "stop" ]; then
  docker-compose --project-name mosaic-${ORIGIN}-${AUXILIARY_NAME} down
fi
