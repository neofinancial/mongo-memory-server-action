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

describe('MemoryServerFactory with bad inputs', () => {
  // suppress console.warn coming from mongo-memory-server
  let consoleWarnSpy: jest.SpyInstance<void, [message?: unknown, ...optionalParams: unknown[]]>;

  beforeAll(async () => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  test('throws an error when provided an invalid version', async () => {
    const badVersion = '9999';
    const promise = MemoryServerFactory.generateMemoryServer(
      expectedDbName,
      expectedPort,
      expectedStorageEngine,
      badVersion
    );

    await expect(promise).rejects.toThrow("Status Code is 403 (MongoDB's 404)");
  });

  test('throws an error when provided an invalid storageEngine', async () => {
    const badStorageEngine = 'noSuchEngine';
    const promise = MemoryServerFactory.generateMemoryServer(
      expectedDbName,
      expectedPort,
      badStorageEngine,
      expectedVersion
    );

    await expect(promise).rejects.toThrow('Instance Exited before being ready and without throwing an error!');
  });

  test('throws an error when provided an invalid port', async () => {
    const badPort = 999999;
    const promise = MemoryServerFactory.generateMemoryServer(
      expectedDbName,
      badPort,
      expectedStorageEngine,
      expectedVersion
    );

    await expect(promise).rejects.toThrow(`options.port should be >= 0 and < 65536. Received ${badPort}.`);
  });

  test('unfortunately does NOT throw an error when provided a dbName that is too long', async () => {
    const badDbName = 'monogram'.repeat(20);

    return MemoryServerFactory.generateMemoryServer(
      badDbName,
      expectedPort,
      expectedStorageEngine,
      expectedVersion
    ).then(_server => {
      expect(_server).toBeInstanceOf(MongoMemoryServer);

      return _server.stop(true)
    })
  });

  afterAll(async () => {
    consoleWarnSpy.mockRestore();
  });
});
