# mongodb-ci-action

[![Build status](https://github.com/jeffrey-dugas-neo/action-repo/workflows/CI/badge.svg)](https://github.com/jeffrey-dugas-neo/action-repo/actions)

Provides a CI-time MongoDB memory ([WiredTiger](https://docs.mongodb.com/manual/core/wiredtiger/)) database using [mongo-memory-server](https://github.com/nodkz/mongodb-memory-server), and sets a connection string environment variable. This can be used for testing database seeding processes or provide support for integration testing as part of your GitHub Action.

## Usage

In your .github/workflows folder, add a new job step to the appropriate workflow:

```yaml
      - uses: jeffrey-dugas-neo/action-repo@v1.0.0
        with:
          db_connection_env_var: MONGO_CONNECTION_STRING
          run_command: yarn seed:database
          mongodb_version: '4.0.9' # optional
          db_connection2_env_var: MONGO_CONNECTION_STRING_FOR_SECOND_CLIENT # optional
```

- `db_connection_env_var` and `db_connection2_env_var` allow you to use a single instance of the database for client connections.
- `mongodb_version` allow you to specify a version of the [database engine](https://docs.mongodb.com/v5.0/release-notes/)
  - defaults to `4.0.25` as per the [mongo-memory-server library app defaults](https://github.com/nodkz/mongodb-memory-server/blob/345ecee52e9cc86028ac0510ab8dce55a896b13f/packages/mongodb-memory-server-core/src/util/resolveConfig.ts#L28)
- `run_command` specifies the name of the shell command to execute once the database is available

## Implementation

In the example, the **`run_command`** parameter value ("`yarn seed:database`") is executed by the action using a synchronous sub-process (via `child_process.execSync(...)`). That script is therefore responsible for reading the ENV variable `MONGO_CONNECTION_STRING` and configuring MongoDB client(s) accordingly.

The memory-server is stopped subsequent to the completion of your script.


## Contributing

### Testing

This repository's CI workflow has a 'validate' job @ `src/validate.ts` (technically, `bin/validate.js`) for internal, CI-time testing of the action's functionality.

* please try to cover the intended capability when making small changes
* consider executing any scripts that begin with `validate-` if additional use-cases are required

### Versioning

Semantic versioning should be applied via the CI workflow by updating the `tag` value. Because the tagging step only occurs in the `main` branch, only a merge into `main` will trigger the bump.

```yaml
      - name: Commit build
        if: github.ref == 'refs/heads/main'
        uses: endbug/add-and-commit@v7
        with:
          add: bin
          author_email: jeffrey.dugas@neofinancial.com
          author_name: Neo Financial Engineering
          push: true
          signoff: true
          tag: 'v1.0.0 --force'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
