#!/bin/bash

PROJECT_NAME=""
VALUE_SERVICE_NAME=""
UTILITY_SERVICE_NAME=""
VALUE_BACKUP_FILE=""
UTILITY_BACKUP_FILE=""

function print_help {
    echo "Helper script to manage geth containers."
    echo ""
    echo "Usage:"
    echo "  ./geth-compose.sh [options...] command [arguments...]"
    echo ""
    echo "NOTE: All three options are mandatory!"
    echo ""
    echo "Examples:"
    echo "  Pull the chain data out of the containers:"
    echo "  ./geth-compose.sh -p mosaic -v geth_rinkeby -u geth_utility_1409 backup"
    echo ""
    echo "  Initialising the containers with existing chain data:"
    echo "  ./geth-compose.sh -p mosaic -v geth_rinkeby -u geth_utility_1409 init backup_rinkeby.tar backup_utility.tar"
    echo ""
    echo "  Start the geth services:"
    echo "  ./geth-compose.sh -p mosaic -v geth_rinkeby -u geth_utility_1409 start"
    echo ""
    echo "  Longer initialisation example:"
    echo "  ./geth-compose.sh -p mosaic \\"
    echo "      -v geth_rinkeby \\"
    echo "      -u geth_utility_1409 \\"
    echo "      init \\"
    echo "      backup_mosaic_geth_rinkeby_1_1535549887.tar.gz \\"
    echo "      backup_mosaic_geth_utility_1409_1_1535549455.tar.gz"
    echo ""
    echo "Options:"
    echo "  -p|--project <project name>"
    echo "  -v|--value-service <service name>"
    echo "  -u|--utility-service <service name>"
    echo ""
    echo "Commands:"
    echo "  help    Print this help."
    echo "  backup  Creates local backup files of the geth containers' volumes."
    echo "  init    Initialise the containers with the chain data from given tar files."
    echo "  start   Start the geth node containers."
    echo "  stop    Stop the geth node containers."
    echo ""
    echo "Arguments:"
    echo "  init    <value chain backup file> <utility chain backup file>"
}

function error {
    echo "$1"
    echo ""
    print_help

    exit 1
}

function announce {
    echo ""
    echo "###"
    echo "#   $1"
    echo "###"
}

function tar_chain_data {
    container_name=$1
    work_dir=$2
    data_dir=$3
    timestamp=$(date +%s)

    docker run --rm --volumes-from ${container_name} -v $(pwd):/backup debian:jessie bash -c "cd ${work_dir} && tar cvfz /backup/backup_${container_name}_${timestamp}.tar.gz ${data_dir}"
}

function untar_chain_data {
    container_name=$1
    work_dir=$2
    tar_file=$3
    docker run --rm --volumes-from ${container_name} -v $(pwd):/backup debian:jessie bash -c "cd ${work_dir} && tar xvfz /backup/${tar_file}"
}

function backup {
    echo "Creating backup files from geth containers' volumes. Grab a coffee."

    announce "Backing up utility."
    tar_chain_data ${PROJECT_NAME}_${UTILITY_SERVICE_NAME}_1 /usr/utility_node ./uc_node

    announce "Backing up value."
    tar_chain_data ${PROJECT_NAME}_${VALUE_SERVICE_NAME}_1 /root ./.ethereum
}

function init {
    echo "Initialising geth containers from existing backups. Grab a coffee."

    announce "Creating containers."
    docker-compose --project-name ${PROJECT_NAME} up --no-start ${VALUE_SERVICE_NAME} ${UTILITY_SERVICE_NAME}

    announce "Copying rinkeby chain data into the container volume."
    untar_chain_data ${PROJECT_NAME}_${VALUE_SERVICE_NAME}_1 /root ${VALUE_BACKUP_FILE}

    announce "Copying utility chain data into the container volume."
    untar_chain_data ${PROJECT_NAME}_${UTILITY_SERVICE_NAME}_1 /usr/utility_node ${UTILITY_BACKUP_FILE}
}

function start {
    announce "Starting geth node containers."
    docker-compose --project-name ${PROJECT_NAME} start ${VALUE_SERVICE_NAME} ${UTILITY_SERVICE_NAME}
}

function stop {
    announce "Stopping geth node containers."
    docker-compose --project-name ${PROJECT_NAME} stop ${VALUE_SERVICE_NAME} ${UTILITY_SERVICE_NAME}
}

#
# Parse command line arguments
#
COMMAND=""
if [[ $# -eq 0 ]]
then
    error "Missing command or argument!"
fi
while [[ $# -gt 0 ]]
do
    if [[ $COMMAND != "" ]]
    then
        error "Unrecognised or missing argument!"
    fi

    opt="$1"
    case $opt in
        help|-h|--help)
            print_help
	    exit 0
            ;;
        -p|--project)
            PROJECT_NAME="$2"
            shift 2
            ;;
        -v|--value-service)
            VALUE_SERVICE_NAME="$2"
            shift 2
            ;;
        -u|--utility-service)
            UTILITY_SERVICE_NAME="$2"
            shift 2
            ;;
        backup)
            COMMAND="backup"
            shift
            ;;
        init)
            COMMAND="init"
            VALUE_BACKUP_FILE=$2
            UTILITY_BACKUP_FILE=$3
            shift 3
            ;;
        start)
            COMMAND="start"
            shift
            ;;
        stop)
            COMMAND="stop"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

#
# Check sanity
#

if [[ $COMMAND = "" ]]
then
    error "Missing command!"
fi

if [[ $PROJECT_NAME = "" ]]
then
    error "Missing project name. Must specify '-p'!"
fi

if [[ $VALUE_SERVICE_NAME = "" ]]
then
    error "Missing value service name. Must specify '-v'!"
fi

if [[ $UTILITY_SERVICE_NAME = "" ]]
then
    error "Missing utility service name. Must specify '-u'!"
fi

if [[ $COMMAND = "init" ]]
then
    if [[ $VALUE_BACKUP_FILE = "" ]]
    then
        error "Missing value backup file for initialisation!"
    fi

    if [[ ! -f $VALUE_BACKUP_FILE ]]
    then
        error "Value backup file does not exist: $VALUE_BACKUP_FILE"
    fi

    if [[ $UTILITY_BACKUP_FILE = "" ]]
    then
        error "Missing utility backup file for initialisation!"
    fi

    if [[ ! -f $UTILITY_BACKUP_FILE ]]
    then
        error "Utility backup file does not exist: $UTILITY_BACKUP_FILE"
    fi
fi

#
# Run command
#
case $COMMAND in
    help)
        print_help
        ;;
    backup)
        backup
        ;;
    init)
        init
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
esac
