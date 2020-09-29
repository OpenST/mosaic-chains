# TheGraph & Mosaic Subgraph

## 1406

Run `1406` mosaic chain:

```bash
  npm ci
  ./mosaic start 1406 --withoutGraphNode --origin ropsten
```

Assert `1406` mosaic chain is running:

```bash
  docker container inspect -f '{{.State.Running}}' mosaic_1406 # returns true
```

Note down `1406` mosaic chain endpoints printed on the terminal:

```bash
Below are the list of endpoints for 1406 chain :
| Type |             URL             |
| :--: | :-------------------------: |
|  rpc | http://10.1.21.202:41406 |
|  ws  |  ws://10.1.21.202:51406  |
```

Run a graph node against `1406` mosaic chain RPC endpoint:

```bash
  ./mosaic graph-start \
        --container-name "1406-graph-container" \
        --ethereum-rpc-endpoint "dev:http://10.1.21.202:41406" \
        --graph-datadir "~/.mosaic/1406_graph_datadir" \
        --graph-rpc-port "52406" \
        --graph-ws-port "42406" \
        --graph-rpc-adming-port "53406" \
        --graph-ipfs-port "55406" \
        --graph-postgres-database "graph-node" \
        --graph-postgres-user "iam" \
        --graph-postgres-password "let-me-in" \
        --graph-postgres-port "56406"
```

The command above, starts three docker containers:

- 1406-graph-container_graph-node_*
- 1406-graph-container_postgres_*
- 1406-graph-container_ipfs_*

Assert all containers up and running:

```bash
  docker container inspect -f '{{.State.Running}}' 1406-graph-container_graph-node_1 # outputs true
  docker container inspect -f '{{.State.Running}}' 1406-graph-container_postgres_1 # outputs true
  docker container inspect -f '{{.State.Running}}' 1406-graph-container_ipfs_1 # outputs true
```

Make sure there is no error in `1406-graph-container_graph-node_*` container by
inspecting docker container:

```bash
  docker logs 1406-graph-container_graph-node_1 --follow
```

Note down the graph node endpoints printed on the terminal:

```bash
 Below are the list of endpoints for graph node :
|        Type       |               URL               |
| :---------------: | :-----------------------------: |
| ethereum-endpoint | dev:http://10.1.21.202:41406 |
|     graph-rpc     |     http://10.1.21.202:52406    |
|      graph-ws     |      ws://10.1.21.202:42406     |
|    graph-admin    |     http://10.1.21.202:53406    |

 Below are the list of endpoints for postgres db :
|     Type     |            URL           |
| :----------: | :----------------------: |
| postgres-rpc | http://10.1.21.202:56406 |

 Below are the list of endpoints for ipfs :
|   Type   |            URL           |
| :------: | :----------------------: |
| ipfs-rpc | http://10.1.21.202:55406 |
```

Deploy mosaic subgraph (v0.12 mosaic contracts) by specifing graph admin rpc and graph ipfs endpoints:

```bash
./mosaic subgraph ropsten 1406 auxiliary http://10.1.21.202:53406 http://10.1.21.202:55406 -m ./chains/ropsten/mosaic.json
```

If deployed successfully, note down the subgraph endpoints printed on the terminal:

```bash
 Sub-graph details :
| Chain |  Subgraph name  |  Subgraph websocket endpoint  |  Subgraph rpc endpoint  |
| auxiliary | mosaic/auxiliary-02cffaa1e06c28021fff6b | ws://{host}:{graph-ws-port}/subgraphs/name/mosaic/auxiliary-02cffaa1e06c28021fff6b | http://{host}:{graph-http-port}/subgraphs/name/mosaic/auxiliary-02cffaa1e06c28021fff6b |

ℹ️ Replace `host` (the system ip, `http://10.1.21.202` in our examples),
`graph-ws-port` and `graph-http-port` (RPC port) with currect values.
```

To view the graph internal postgres database instal pgAdmin (or other postgres GUI client).

For macos:

```bash
brew cask install pgadmin4
```

Run the pgadmin4 and connect to graph node postgres endpoint that have been noted.
In the current doc:

- Hostname/address is `10.1.21.202`
- Port: 56406
- Maintenance database: graph-node
- User: iam
- Password: let-me-in

The subgraph data is stored under `sgd1` schema.

One can also make a GraphQl query against deployed subgraph endpoint:

 ```bash
curl -v -POST "http://10.1.21.202:52406/subgraphs/name/mosaic/auxiliary-02cffaa1e06c28021fff6b" \
    -H "Content-Type: application/json" \
    -d '{
            "query": "{ stateRootAvailable(id: \"0xddfa06fe9f08dc8bf71fee0e7ff062a6f6ca1bc64d4527608443c75ec885759d-0\") { _blockHeight } }"
        }'
 ```
