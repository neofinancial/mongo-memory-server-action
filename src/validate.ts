import * as core from '@actions/core';
import { MongoClient } from 'mongodb';

async function runTest(): Promise<void> {
  console.log('Testing connectivity via MongoClient- validate');

  const connectionString = process.env['MONGO_CONNECTION_STRING'] as string;
  const client = new MongoClient(connectionString, { useUnifiedTopology: true });

  try {
    await client.connect();
    console.log(`Client connected: ${client.isConnected()}`);
  } catch (err) {
    core.setFailed(err.message);

    throw err;
  } finally {
    await client.close();
  }
}

runTest();
