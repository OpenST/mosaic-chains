 Following are the steps to publish the Docker image.

1. Copy `Dockerfile` and startup.sh in docker directory
    
    `docker/Dockerfile`
    
    `docker/startup.sh`
2. Create the following directories
    
    `docker/origin_volume`
    
    `docker/auxiliary_volume`

3. Copy the origin and auxiliary chain data to the following location 
    
    `docker/origin`
    
    `docker/<auxiliary chain id>`

4. The origin and <auxiliary chain id> directory should have the following content
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
5. Go to docker folder and run the following.     
6. Use the following command to build the docker image. 
`docker build -t mosaicdao/dev-chains . -f docker/Dockerfile`

7. Use the following command to publish the Docker image.
`docker push mosaicdao/dev-chains`

