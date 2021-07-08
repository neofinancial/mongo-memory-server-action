import * as core from '@actions/core';
import { MongoClient } from 'mongodb';

async function runTest(): Promise<void> {
  console.info('Testing connectivity via MongoClient');

  const connectionString = process.env['MONGO_CONNECTION_STRING'] as string;
  let client: MongoClient | undefined;

  try {
    client = new MongoClient(connectionString, { useUnifiedTopology: true });
    await client.connect();
    console.log(`Client connected: ${client.isConnected()}`);

    // do work
  } catch (err) {
    core.setFailed(err.message);
    console.error(`Error encountered opening connection to: ${connectionString}`, err);

    throw err;
  } finally {
    if (client?.isConnected()) {
      await client.close();
      console.log(`Client disconnected: ${!client.isConnected()}`);
    }
  }
}

runTest();
