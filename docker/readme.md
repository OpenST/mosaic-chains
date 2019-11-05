 Following are the steps to publish the Docker image.

1. Copy `Dockerfile` and startup.sh in docker directory
    
    `docker/Dockerfile`
    
    `docker/startup.sh`

2. Create the following directories
    
    `docker/root/origin-geth`
    
    `docker/root/1000`

3. Copy the origin and auxiliary chain data to the following location 
    
    `docker/chain_data/origin-geth`
    
    `docker/chain_data/<auxiliary chain id>`

4. `The origin-geth` and <auxiliary chain id> directory should have the following content

    ```typescript
    - dev_pass (file) 
    - genesis.json (file)
    - geth (directory)
        |- chaindata
        |- lightchaindata
        |- LOCK
        |- nodekey
        |- nodes
        |- transactions.rlp
        
    - keystore (directory)
        |- UTC--xxxxxxxxx
        |- UTC--xxxxxxxxx
        .
        .
    ```
5. Move the mosaic config file in `configs` directory.

6. Go to docker folder. Run the following command to build the docker image.

    `docker build -t mosaicdao/dev-chains . -f docker/Dockerfile`
    
7. Authenticate docker with `Docker login` if not already done.    

7. Run the following command to publish the Docker image.

    `docker push mosaicdao/dev-chains`

