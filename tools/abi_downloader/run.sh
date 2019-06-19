#!/usr/bin/env bash
default_version='0.10.0'
package='@openst/mosaic-contracts'
default="the default value"
read -p "Enter mosaic contracts version [default=$default_version] " version
: ${version:=${default_version}}

version_count=$(grep -o '\.' <<<"$version" | grep -c .)
if ((version_count ==1)) || ((version_count ==2))
then
    mosaic_contract_package=${package}$"@"${version}
    echo ${mosaic_contract_package}
    npm install ${mosaic_contract_package} --no-save
    ts-node tools/abi_downloader/index.ts ${version}
else
    echo "Enter version in format MAJOR.MINOR or MAJOR.MINOR.PATCH"
    exit
fi
