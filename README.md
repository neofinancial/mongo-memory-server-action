# mongo-memory-server-action

[![Build status](https://github.com/neofinancial/mongo-memory-server-action/workflows/ci/badge.svg)](https://github.com/neofinancial/mongo-memory-server-action/actions)
[![coverage](https://coverage.neotools.ca/api/badge/master/4EUt9DTZZpn3u1KfBtNpjn)](https://coverage.neotools.ca/coverage/neofinancial/mongo-memory-server-action)
[![Test status](https://github.com/neofinancial/mongo-memory-server-action/workflows/pull-request/badge.svg)](https://github.com/neofinancial/mongo-memory-server-action/actions)
[![Publish status](https://github.com/neofinancial/mongo-memory-server-action/workflows/publish/badge.svg)](https://github.com/neofinancial/mongo-memory-server-action/actions)

Provides a CI-time MongoDB memory database using [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server), sets your specified environment variable to the new server's connection string, and executes your specified script. Created to support CI-time testing of:

- seed and migration scripts,
- complex queries,
- schema implementation,
- or any MongoDB-dependent process where a mock database might not be suitable.

## Usage

In your .github/workflows folder, add a new job step to the appropriate workflow:

```yaml
- uses: neofinancial/mongo-memory-server-action@v1.0.2
  with:
    db-connection-env-var: MONGODB_CONNECTION_STRING
    run-command: yarn use:database
    binary-version: 4.4.6
    instance-dbName: validation
    instance-port: 27017
    instance-storageEngine: wiredTiger
    mongoms-debug: 1
```

| Input                    | Description                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db-connection-env-var`  | **required**: the ENV variable that the action will set to provide the DB connection string to your script                                                                                                                                                                                                                              |
| `run-command`            | **required**: the shell command the action will execute once the database is available                                                                                                                                                                                                                                                  |
| `binary-version`         | specify a version of the [database engine](https://docs.mongodb.com/v5.0/release-notes/) - defaults to `4.0.25` as per the [mongodb-memory-server library app defaults](https://github.com/nodkz/mongodb-memory-server/blob/345ecee52e9cc86028ac0510ab8dce55a896b13f/packages/mongodb-memory-server-core/src/util/resolveConfig.ts#L28) |
| `instance-dbName`        | a database name (defaults to a [random string](https://github.com/nodkz/mongodb-memory-server#available-options-for-mongomemoryserver))                                                                                                                                                                                                 |
| `instance-port`          | the port the DB will listen on (defaults to ["27017"](https://github.com/nodkz/mongodb-memory-server#available-options-for-mongomemoryserver))                                                                                                                                                                                          |
| `instance-storageEngine` | the storage engine (defaults to ["ephemeralForTest"](https://github.com/nodkz/mongodb-memory-server#available-options-for-mongomemoryserver); alternatively, use ["wiredTiger"](https://docs.mongodb.com/manual/core/wiredtiger/))                                                                                                      |
| `mongoms-debug`          | if provided _and given any value_, sets the ENV variable used by mongodb-memory-server for [Debug mode](https://github.com/nodkz/mongodb-memory-server#enable-debug-mode)                                                                                                                                                               |

## Implementation

In the example, the **`run-command`** parameter value ("`yarn use:database`") is executed synchronously by the action using a child process. That script is therefore responsible for reading the ENV variable `MONGODB_CONNECTION_STRING` and configuring MongoDB client(s) accordingly.

The memory-server is stopped (and destroyed) subsequent to the completion of this command, so the command's process should encompass all interactions with it.

## Contributing

### Testing

This repository's CI workflow has a 'validate' job @ `src/validate.ts` (technically, `build/validate.js`) for internal, CI-time testing of the action's functionality; this simply opens and closes a connection to the memory-server to ensure the validity of the provided ENV variable. There are also a small number of unit tests to ensure the memory-server's configuration values are passed to the memory-server appropriately.

- please try to cover the new capability when making small changes
- as necessary, add validation for variables passed directly to the initialization of the memory-server

### Versioning

Semantic versioning should be applied via the CI workflow by updating the version in `package.json` (and the reference to it in this README.md). The `publish` workflow will be triggered on the merge into `master`, generating a tag name from the package version.
