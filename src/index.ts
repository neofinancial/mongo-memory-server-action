import { execSync } from 'child_process';
import { MongoMemoryServerStates } from 'mongodb-memory-server-core/lib/MongoMemoryServer';
import { MongoMemoryServer } from 'mongodb-memory-server-global';

import * as core from '@actions/core';

import { MemoryServerFactory } from './factory/memory-server-factory';

async function runCommand(command: string, connectionString: string): Promise<string> {
  console.info(`Executing the target script: "${command}"`);

  const connectionStringEnvVar = core.getInput('db-connection-env-var');
  const mongoMsDebug = core.getInput('mongoms-debug');

  process.env[connectionStringEnvVar] = connectionString;

  if (mongoMsDebug) {
    console.log('Using MONGOMS_DEBUG setting');
    process.env['MONGOMS_DEBUG'] = '1';
  }

  try {
    return execSync(command, { env: process.env, cwd: process.env.githubRepository }).toString();
  } catch (err) {
    console.error(err);

    throw err;
  }
}

async function run(): Promise<void> {
  let mongodb: MongoMemoryServer | undefined;

  try {
    const dbName = core.getInput('instance-dbName');
    const port: number = Number.parseInt(core.getInput('instance-port'));
    const storageEngine = core.getInput('instance-storageEngine');
    const version = core.getInput('binary-version');

    mongodb = await MemoryServerFactory.generateMemoryServer(dbName, port, storageEngine, version);

    const connectionString = await MemoryServerFactory.verifyMemoryServer(mongodb);
    const command = core.getInput('run-command');

    const stdOut = await runCommand(command, connectionString);

    console.info(stdOut);
  } catch (err) {
    core.setFailed(err.message);
  } finally {
    if (mongodb?.state === MongoMemoryServerStates.running) {
      await mongodb.stop();
    }
  }
}

run();
