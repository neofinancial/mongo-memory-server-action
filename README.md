# mongodb-ci-action

[![Build status](https://github.com/neofinancial/mongodb-ci-action/workflows/CI/badge.svg)](https://github.com/neofinancial/mongodb-ci-action/actions)

Provides a CI-time MongoDB memory database using [mongo-memory-server](https://github.com/nodkz/mongodb-memory-server), sets your specified environment variable to the new server's connection string, and executes your specified script. Created to support CI-time testing of database-seed scripts, but suitable for testing other MongoDB-dependent processes in favor of a full database mock.

## Usage

In your .github/workflows folder, add a new job step to the appropriate workflow:

```yaml
      - uses: neofinancial/mongodb-ci-action@v1.0.0
        with:
          db-connection-env-var: MONGO_CONNECTION_STRING
          run-command: yarn use:database
          binary-version: 4.0.9
          instance-dbName: validation
          instance-port: 27017
          instance-storageEngine: wiredTiger
          mongoms-debug: 1
```

| Input  	| Description  	|
|---	|---	|
| `db-connection-env-var`	| __required__: the ENV variable that the action will set to provide the DB connection string to your script  	|
| `run-command` 	| __required__: the shell command the action will execute once the database is available  	|
| `binary-version` 	| specify a version of the [database engine](https://docs.mongodb.com/v5.0/release-notes/) - defaults to `4.0.25` as per the [mongo-memory-server library app defaults](https://github.com/nodkz/mongodb-memory-server/blob/345ecee52e9cc86028ac0510ab8dce55a896b13f/packages/mongodb-memory-server-core/src/util/resolveConfig.ts#L28) |
| `instance-dbName`  	| a database name (defaults to a [random string](https://github.com/nodkz/mongodb-memory-server#available-options-for-mongomemoryserver)) 	|
| `instance-port`  	| the port the DB will listen on (defaults to ["27017"](https://github.com/nodkz/mongodb-memory-server#available-options-for-mongomemoryserver)) 	|
| `instance-storageEngine` 	| the storage engine (defaults to ["ephemeralForTest"](https://github.com/nodkz/mongodb-memory-server#available-options-for-mongomemoryserver); alternatively, use ["wiredTiger"](https://docs.mongodb.com/manual/core/wiredtiger/))  	|
| `mongoms-debug`  | if provided _and given any value_, sets the ENV variable used by mongo-memory-server for [Debug mode](https://github.com/nodkz/mongodb-memory-server#enable-debug-mode)	|


## Implementation

In the example, the **`run-command`** parameter value ("`yarn seed:database`") is executed synchronously by the action using a child process. That script is therefore responsible for reading the ENV variable `MONGO_CONNECTION_STRING` and configuring MongoDB client(s) accordingly.

The memory-server is stopped (and destroyed) subsequent to the completion of this command, so the command's process should encompass all interactions with it.

## Contributing

### Testing

This repository's CI workflow has a 'validate' job @ `src/validate.ts` (technically, `build/validate.js`) for internal, CI-time testing of the action's functionality; this simply opens and closes a connection to the memory-server to ensure the validity of the provided ENV variable. There are also a small number of unit tests to ensure the memory-server's configuration values are passed to the memory-server appropriately.

* please try to cover the new capability when making small changes
* as necessary, add validation for variables passed directly to the initialization of the memory-server

### Versioning

Semantic versioning should be applied via the CI workflow by updating the `tag` value. Because the tagging step only occurs in the `master` branch, only a merge into `master` will trigger the bump.

```yaml
      - name: Commit build
        if: github.ref == 'refs/heads/master'
        uses: endbug/add-and-commit@v7
        with:
          add: build
          author_name: Neo Financial Engineering
          push: true
          signoff: true
          tag: 'v1.0.0 -m "your message here"'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

To bump the version as part of a pull request:

- update the package.json "version"
- update the `Tag` step of the "build" job in the CI workflow (.github/workflows/ci.yaml)
- update this README to reference tha latest tag
