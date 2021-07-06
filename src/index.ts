import * as core from '@actions/core';
import { MongoMemoryServer } from 'mongodb-memory-server-global';
import { MongoBinaryOpts } from 'mongodb-memory-server-core/lib/util/MongoBinary';
import { MongoMemoryInstanceOpts } from 'mongodb-memory-server-core/lib/util/MongoInstance';
import { MongoMemoryServerOpts, MongoMemoryServerStates } from 'mongodb-memory-server-core/lib/MongoMemoryServer';
import { execSync } from 'child_process';
import { MongoClient } from 'mongodb';

async function generateMemoryServer(): Promise<MongoMemoryServer> {
  console.log('Creating MongoMemoryServer instance');

  const instanceOpts: MongoMemoryInstanceOpts = {
    storageEngine: 'wiredTiger',
  };
  const dbName = core.getInput('instance_dbName');
  const port: number = Number.parseInt(core.getInput('instance_port'));

  if (dbName || dbName !== '') {
    instanceOpts.dbName = dbName;
  }

  if (port) {
    instanceOpts.port = port;
  }

  const binaryOpts: MongoBinaryOpts = { checkMD5: true };
  const version = core.getInput('binary_version');

  if (version || version !== '') {
    binaryOpts.version = version;
  }

  const opts: MongoMemoryServerOpts = {
    instance: instanceOpts,
    binary: binaryOpts,
  };

  const server: MongoMemoryServer = await MongoMemoryServer.create(opts);

  return server;
}

async function verifyMemoryServer(server: MongoMemoryServer): Promise<string> {
  console.log('Testing connectivity to new MongoMemoryServer instance via MongoClient');

  let client: MongoClient | undefined;

  try {
    const memoryServerUri = server.getUri();

    console.info(`Connection string: ${memoryServerUri}`);

    client = new MongoClient(memoryServerUri, { useUnifiedTopology: true, useNewUrlParser: true });

    await client.connect();
    console.info(`Client connected: ${client.isConnected()}`);

    return memoryServerUri;
  } catch (err) {
    console.error(err);

    throw err;
  } finally {
    if (client?.isConnected()) {
      await client.close();
    }
  }
}

async function runCommand(command: string, connectionString: string): Promise<void> {
  console.log(`Executing the target script: "${command}"`);

  const connectionStringEnvVar = core.getInput('db_connection_env_var');

  process.env[connectionStringEnvVar] = connectionString;

  try {
    execSync(command, { env: process.env, cwd: process.env.githubRepository }).toString();
  } catch (err) {
    console.error(err);

    throw err;
  }
}

async function run(): Promise<void> {
  let mongodb: MongoMemoryServer | undefined;

  try {
    mongodb = await generateMemoryServer();

    const connectionString = await verifyMemoryServer(mongodb);
    const command = core.getInput('run_command');

    await runCommand(command, connectionString);
  } catch (err) {
    core.setFailed(err.message);
  } finally {
    if (mongodb?.state === MongoMemoryServerStates.running) {
      await mongodb.stop();
    }
  }
}

run();
