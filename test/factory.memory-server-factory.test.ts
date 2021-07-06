import { MongoMemoryServer, MongoMemoryServerStates } from 'mongodb-memory-server-core/lib/MongoMemoryServer';
import { StorageEngine } from 'mongodb-memory-server-core/lib/util/MongoInstance';

import { MemoryServerFactory } from '../src/factory/memory-server-factory';

let server: MongoMemoryServer;
const expectedPort = 27019;
const expectedDbName = 'validation';
const expectedStorageEngine: StorageEngine = 'wiredTiger';
const expectedVersion = '4.4.6';

describe('MemoryServerFactory', () => {
  beforeAll(async () => {
    server = await MemoryServerFactory.generateMemoryServer(
      expectedDbName,
      expectedPort,
      expectedStorageEngine,
      expectedVersion
    );
    await MemoryServerFactory.verifyMemoryServer(server);
  });

  afterAll(async () => {
    if (server?.state === MongoMemoryServerStates.running) {
      await server.stop(true);
    }
  });

  test('creates a running MongoMemoryServer instance', () => {
    expect(server).toBeInstanceOf(MongoMemoryServer);
    expect(server.state).toBe(MongoMemoryServerStates.running);
  });

  test('that has the expected port', () => {
    expect(server.instanceInfo?.port).toEqual(expectedPort);
  });

  test('that has the expected dbName', () => {
    expect(server.instanceInfo?.dbName).toEqual(expectedDbName);
  });

  test('that has the expected storageEngine', () => {
    expect(server.instanceInfo?.storageEngine).toEqual(expectedStorageEngine);
  });

  test('that has the expected version', () => {
    expect(server.instanceInfo?.instance.binaryOpts.version).toEqual(expectedVersion);
  });
});
