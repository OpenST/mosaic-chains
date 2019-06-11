#!/usr/bin/env bash
default_version='0.10.0'
package='@openst/mosaic-contracts'
default="the default value"
read -p "Enter mosaic contracts version [default=$default_version] " version
: ${version:=${default_version}}

mosaic_contract_package=${package}$"@"${version}
echo ${mosaic_contract_package}
npm install ${mosaic_contract_package} --no-save
ts-node tools/abi_downloader/index.js ${version}
