import { MongoMemoryServer, MongoMemoryServerStates } from 'mongodb-memory-server-core/lib/MongoMemoryServer';
import { StorageEngine } from 'mongodb-memory-server-core/lib/util/MongoInstance';

import { MemoryServerFactory } from '../src/factory/memory-server-factory';

let server: MongoMemoryServer;
const expectedPort = 27019;
const expectedDbName = 'validation';
const expectedStorageEngine: StorageEngine = 'wiredTiger';
const expectedVersion = '4.4.6';

describe('MemoryServerFactory', () => {
  describe('generateMemoryServer', () => {
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

    test('should create a running MongoMemoryServer instance', () => {
      expect(server).toBeInstanceOf(MongoMemoryServer);
      expect(server.state).toBe(MongoMemoryServerStates.running);
    });

    test('should configure the server with the expected port', () => {
      expect(server.instanceInfo?.port).toEqual(expectedPort);
    });

    test('should configure the server with the expected dbName', () => {
      expect(server.instanceInfo?.dbName).toEqual(expectedDbName);
    });

    test('should configure the server with the expected storageEngine', () => {
      expect(server.instanceInfo?.storageEngine).toEqual(expectedStorageEngine);
    });

    test('should configure the expected version of the server', () => {
      expect(server.instanceInfo?.instance.binaryOpts.version).toEqual(expectedVersion);
    });
  });

  describe('generateMemoryServer with invalid inputs', () => {
    // suppress console.warn coming from mongo-memory-server
    let consoleWarnSpy: jest.SpyInstance<void, [message?: unknown, ...optionalParams: unknown[]]>;

    beforeAll(async () => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    test('should throw an error when provided an invalid version', async () => {
      const badVersion = '9999';
      const promise = MemoryServerFactory.generateMemoryServer(
        expectedDbName,
        expectedPort,
        expectedStorageEngine,
        badVersion
      );

      await expect(promise).rejects.toThrow("Status Code is 403 (MongoDB's 404)");
    });

    test('should throw an error when provided an invalid storageEngine', async () => {
      const badStorageEngine = 'noSuchEngine';
      const promise = MemoryServerFactory.generateMemoryServer(
        expectedDbName,
        expectedPort,
        badStorageEngine,
        expectedVersion
      );

      await expect(promise).rejects.toThrow('Instance Exited before being ready and without throwing an error!');
    });

    test('should throw an error when provided an invalid port', async () => {
      const badPort = 999999;
      const promise = MemoryServerFactory.generateMemoryServer(
        expectedDbName,
        badPort,
        expectedStorageEngine,
        expectedVersion
      );

      await expect(promise).rejects.toThrow(`options.port should be >= 0 and < 65536. Received type number (${badPort}).`);
    });

    test('unfortunately does NOT throw an error when provided a dbName that is too long', async () => {
      const badDbName = 'monogram'.repeat(20);

      return MemoryServerFactory.generateMemoryServer(
        badDbName,
        expectedPort,
        expectedStorageEngine,
        expectedVersion
      ).then((_server) => {
        expect(_server).toBeInstanceOf(MongoMemoryServer);

        return _server.stop(true);
      });
    });

    afterAll(async () => {
      consoleWarnSpy.mockRestore();
    });
  });
});
