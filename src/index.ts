import * as core from '@actions/core';
import { MongoMemoryServer } from 'mongodb-memory-server-global';
import { MongoBinaryOpts } from 'mongodb-memory-server-core/lib/util/MongoBinary';
import { MongoMemoryServerOpts } from 'mongodb-memory-server-core/lib/MongoMemoryServer';
import { execSync } from 'child_process';
import { MongoClient } from 'mongodb';

/**
 * Promise to create a new mongodb memory server.
 */
const createServer = async (): Promise<MongoMemoryServer> => {
  console.log('Creating MongoMemoryServer instance');

  const opts: MongoMemoryServerOpts = {
    instance: {
      storageEngine: 'wiredTiger',
      port: 27017,
    },
  };

  const mongodbVersion = core.getInput('mongodb_version');

  if (mongodbVersion) {
    const binaryOpts: MongoBinaryOpts = { version: mongodbVersion };

    opts.binary = binaryOpts;
  }

  const mongoServer: MongoMemoryServer = await MongoMemoryServer.create(opts);

  return mongoServer;
};

/**
 * Promise to test that server's general availability with a client connect/disconnect cycle.
 */
const testServer = async (memoryServer: MongoMemoryServer): Promise<MongoMemoryServer> => {
  console.log('Testing connectivity to new MongoMemoryServer instance via MongoClient');

  const memoryServerUri = memoryServer.getUri();
  const connectionString = `${memoryServerUri}retryWrites=true`;
  const client = new MongoClient(connectionString, { useUnifiedTopology: true });

  try {
    await client.connect();
    console.log(`Client connected: ${client.isConnected()}`);

    // const instanceInfo = memoryServer.getInstanceInfo();
    // console.log(JSON.stringify(instanceInfo, null, 2))
  } catch (err) {
    core.setFailed(err.message);

    throw err;
  } finally {
    await client.close();
  }

  return memoryServer;
};

/**
 * Promise to run the script configured by the Action using the process's environment,
 * after the corresponding ENV variables have been injected into the process.
 */
const exerciseScript = async (memoryServer: MongoMemoryServer): Promise<MongoMemoryServer> => {
  const commandString = core.getInput('run_command');

  console.log(`Executing the target script: "${commandString}"`);

  const memoryServerUri = await memoryServer.getUri();
  const connectionStringEnvVar = core.getInput('db_connection_env_var');
  const connectionStringAnalyticsEnvVar = core.getInput('db_connection2_env_var');
  const connectionString = `${memoryServerUri}retryWrites=true`;

  process.env['MONGODB_SEED_AUTOMATION_ONLY'] = 'ExistenceMeansTrue';
  process.env[connectionStringEnvVar] = connectionString;

  if (connectionStringAnalyticsEnvVar) {
    process.env[connectionStringAnalyticsEnvVar] = connectionString;
  }

  let stdout: string;

  try {
    stdout = execSync(commandString, { env: process.env, cwd: process.env.githubRepository }).toString();

    console.log(`stdout: ${stdout}`);
  } catch (err) {
    core.setFailed(err.message);

    throw err;
  }

  return memoryServer;
};

/**
 * Promise to stop the mongodb memory server.
 */
const stopServer = async (memoryServer: MongoMemoryServer): Promise<void> => {
  console.log('Stopping MongoMemoryServer instance');
  await memoryServer.stop();
};

createServer()
  .then((server) => {
    return testServer(server);
  })
  .then((server) => {
    return exerciseScript(server);
  })
  .then((server) => {
    return stopServer(server);
  })
  .catch((err) => {
    core.setFailed(err.message);
  });
