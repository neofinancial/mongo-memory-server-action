# (48270) Parallelize GitHub Actions workflow

Splitting an individual workflow into separate workflows has some drawbacks:

* a workflow is a good natural barrier
  * while one workflow can trigger another, they aren't inherently related
* passing outputs between workflows is more complex than between jobs

## CI, specifically

Unlike CI tools that don't require multiple checkouts of the original source code, GitHub Actions treats the environment in which a job executes as a first-class entity that requires a fresh checkout of code.

It may actually be possible to ZIP & upload the entire cloned directory and subsequently download it into the workspace.

## tentative workflows

### ticket-check.yaml

* purpose: ensure that a code branch reflects a Clubhouse ticket
* triggers:
  * create a new branch
  * create or otherwise edit a pull request

```yaml
name: ticket-check
on:
  create:
    branches-ignore: [ master, main ]
  pull_request:
    types: [ 'opened', 'edited', 'reopened', 'synchronize' ]
jobs:
  title:
    runs-on: ubuntu-latest
    steps:
      - uses: neofinancial/ticket-check-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          ticketPrefix: 'CH-'
          titleRegex: '^(CH)(-?)(\d{3,})'
          bodyRegex: '(CH)(-?)(\d{3,})'
          bodyURLRegex: 'http(s?):\/\/(app.clubhouse.io)(\/neofinancial)(\/story)\/\d+'
          exemptUsers: 'renovate, dependabot'
```

### ci.yaml

* purpose: perform all jobs that encompass standard continuous integration
* triggers:
  * push to any branch (except the default branch)

```yaml
name: ci
on:
  push:
    branches-ignore: [ master, main ]
defaults:
  runs-on: ubuntu-latest
  # strategy:
  #   matrix:
  #     node: [ 14 ]
env:
  EXECUTE_DATABASE_SEED: 0
jobs:
  cache-dependencies:
    timeout-minutes: 10
    strategy:
      matrix:
        node: [ 14 ]
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: ${{ matrix.node }}
      - id: yarn-cache
        run: echo "::set-output name=dir::$(yarn cache dir)"
      - uses: actions/cache@v2
        with:
          path: ${{ steps.yarn-cache.outputs.dir }}
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-yarn-
      - run: yarn install --prefer-offline --frozen-lockfile --no-progress --non-interactive

  lint:
    needs: [ cache-dependencies ]
    timeout-minutes: 2
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 14
      - id: yarn-cache
        run: echo "::set-output name=dir::$(yarn cache dir)"
      - uses: actions/cache@v2
        with:
          path: ${{ steps.yarn-cache.outputs.dir }}
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-yarn-
      - run: yarn install --prefer-offline --frozen-lockfile --no-progress --non-interactive
      # - run: yarn format
      #   NOTE: If code formatting yields any changes, we could:
      #     - fail
      #     - continue, but set a flag to commit those changes (complexity smell?)
      - run: yarn lint

  build:
    needs: [ cache-dependencies ]
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 14
      - id: yarn-cache
        run: echo "::set-output name=dir::$(yarn cache dir)"
      - uses: actions/cache@v2
        with:
          path: ${{ steps.yarn-cache.outputs.dir }}
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-yarn-
      - run: yarn install --prefer-offline --frozen-lockfile --no-progress --non-interactive
      - run: yarn build
      - name: Zip build
        run: zip -r -q build.zip build
      - uses: actions/upload-artifact@v2
        with:
          name: build-artifact
          path: ./build.zip

  unit-test:
    needs: [ lint, build ]
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 14
      - run: echo "::set-output name=dir::$(yarn cache dir)"
        id: yarn-cache
      - uses: actions/cache@v2
        with:
          path: ${{ steps.yarn-cache.outputs.dir }}
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-yarn-
      - run: yarn install --prefer-offline --frozen-lockfile --no-progress --non-interactive
      - uses: actions/download-artifact@v2
        with:
          name: build-artifact
      - run: unzip -q -o ./build.zip
      - run: yarn test

  database-seed:
    if: {{ env.EXECUTE_DATABASE_SEED == '1' }}
    needs: [ lint, build ]
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 14
      - run: echo "::set-output name=dir::$(yarn cache dir)"
        id: yarn-cache
      - uses: actions/cache@v2
        with:
          path: ${{ steps.yarn-cache.outputs.dir }}
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-yarn-
      - run: yarn install --prefer-offline --frozen-lockfile --no-progress --non-interactive
      - uses: actions/download-artifact@v2
        with:
          name: build-artifact
      - run: unzip -q -o ./build.zip
      - uses: neofinancial/mongo-memory-server-action@v1.0.0
        with:
          db-connection-env-var: MONGO_CONNECTION_STRING
          run-command: yarn use:database
          binary-version: 4.0.9
          instance-dbName: validation
          instance-port: 27017
          instance-storageEngine: wiredTiger
          mongoms-debug: 1
```
