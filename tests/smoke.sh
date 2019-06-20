#!/bin/bash

#
# This file runs some basic mosaic commands to start, list, and stop chains.
# It asserts that the command generally works.
#

# Prints an info string to stdout.
function info {
    echo "INFO: $1"
}

# Prints an error string to stdout after it attempted to stop all running nodes.
function error {
    echo "ERROR! Aborting."
    stop_nodes
    echo "ERROR: $1"
    exit 1
}

# Starts a single origin node.
function start_origin_node {
    info "Starting node $1."
    try_silent "./mosaic start $1" "Could not start node $1."
}

# Starts a single auxiliary node.
function start_auxiliary_node {
    info "Starting node $1."
    try_silent "./mosaic start $1 --origin ropsten" "Could not start node $1."
}

# Stops a single node.
function stop_node {
    info "Stopping node $1."
    try_silent "./mosaic stop $1" "Could not stop node $1."
}

# Starts all nodes for the test.
function start_nodes {
    info "Starting all nodes."
    start_auxiliary_node 1406
    start_auxiliary_node 1407
    start_origin_node ropsten
}

# Stops all nodes for the test.
function stop_nodes {
    info "Stopping all nodes."
    stop_node ropsten
    stop_node 1407
    stop_node 1406
}

# Tries a command without output. Errors if the command does not execute successfully.
function try_silent {
    eval $1 2>&1 || error "$2"
}

# Tries a command without output. Errors if the command *executes successfully.*
function fail_silent {
    eval $1 1>/dev/null 2>&1 && error "$2"
}

# Sets the global variable `grep_command` with the command to check if given chain is running.
function set_node_grep_command {
    grep_command="./mosaic list | grep mosaic_$1"
}

# Sets the global variable `grep_command` with the command to check if given chain's corresponding graph is running.
function set_graph_grep_command {
    grep_command="./mosaic list | grep 'mosaic_graph_$1_graph'"
}

# Errors if the given chain and its graph is not in the output of `mosaic list`.
function grep_try {
    info "Checking that node $1 is listed."
    set_node_grep_command $1
    try_silent "$grep_command" "Node was expected to be running, but is not: $1."
    set_graph_grep_command $1
    try_silent "$grep_command" "Graph was expected to be running, but is not: $1."
}

# Errors if the given chain or its graph *is* in the output of `mosaic list`.
function grep_fail {
    info "Checking that node $1 is *not* listed."
    set_node_grep_command $1
    fail_silent "$grep_command" "Node was not expected to be running, but is: $1."
    set_graph_grep_command $1
    fail_silent "$grep_command" "Graph was not expected to be running, but is: $1."
}

# Errors if an RPC connection to the node is not possible. Works only with chain IDs, not names.
function rpc_node_try {
    info "Checking RPC connection to node $1."
    try_silent "curl -X POST -H \"Content-Type: application/json\" --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_syncing\",\"params\":[],\"id\":1}' 127.0.0.1:4$1" "Could not connect to RPC of node $1."
}

function rpc_origin_sub_graph_try {
    info "Checking RPC connection to origin sub graph at port $2 on node for $1."
    try_silent "./node_modules/.bin/ts-node tests/Graph/SubGraphDeployment/origin-verifier.ts $1 $2" "Origin sub graph at port $2 was expected to be deployed on $1, but wasn't."
}

function rpc_auxiliary_sub_graph_try {
    info "Checking RPC connection to auxiliary sub graph for $1 chain on node."
    try_silent "./node_modules/.bin/ts-node tests/Graph/SubGraphDeployment/auxiliary-verifier.ts $1 6$1" "Auxiliary sub graph was expected to be deployed, but wasn't."
}

# Making sure the mosaic command exists (we are in the right directory).
try_silent "ls mosaic" "Script must be run from the mosaic chains root directory so that the required node modules are available."

# Start all nodes to test.
start_nodes

# Check that the started nodes are listed.
grep_try 1406
grep_try 1407
grep_try ropsten

# Try to RPC call the running nodes.
rpc_node_try 1406
rpc_node_try 1407
rpc_node_try "0003" # Given like this as it is used for the port in `rpc_node_try`.

rpc_origin_sub_graph_try 1406 60003
rpc_origin_sub_graph_try 1407 60003

rpc_auxiliary_sub_graph_try 1406
rpc_auxiliary_sub_graph_try 1407

# Stop and start some nodes and make sure they are or are not running.
stop_node ropsten
grep_fail ropsten

stop_node 1407
grep_fail 1407
grep_try 1406

start_auxiliary_node 1407
grep_try 1407
grep_try 1406
grep_fail ropsten

start_origin_node ropsten
grep_try ropsten

# When done, stop all nodes.
stop_nodes
