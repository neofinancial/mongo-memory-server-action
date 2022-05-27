import { MongoClient } from 'mongodb';
import {
    MongoMemoryServer, MongoMemoryServerOpts
} from 'mongodb-memory-server-core/lib/MongoMemoryServer';
import { MongoBinaryOpts } from 'mongodb-memory-server-core/lib/util/MongoBinary';
import {
    MongoMemoryInstanceOpts, StorageEngine
} from 'mongodb-memory-server-core/lib/util/MongoInstance';

export class MemoryServerFactory {
  public static async generateMemoryServer(
    dbName?: string,
    port?: number,
    storageEngine?: string,
    version?: string
  ): Promise<MongoMemoryServer> {
    const instanceOpts: MongoMemoryInstanceOpts = {};
    const binaryOpts: MongoBinaryOpts = { checkMD5: true };

    if (dbName) {
      instanceOpts.dbName = dbName;
    }

    if (port) {
      instanceOpts.port = port;
    }

    if (storageEngine) {
      instanceOpts.storageEngine = storageEngine as StorageEngine;
    }

    if (version) {
      binaryOpts.version = version;
    }

    const opts: MongoMemoryServerOpts = {
      instance: instanceOpts,
      binary: binaryOpts,
    };

    const server: MongoMemoryServer = await MongoMemoryServer.create(opts);

    return server;
  }

  public static async verifyMemoryServer(server: MongoMemoryServer, maxPool?: number): Promise<string> {
    let client: MongoClient | undefined;
    const maxPoolSize = maxPool || 10;

    try {
      const memoryServerUri = server.getUri();

      client = new MongoClient(memoryServerUri, { useUnifiedTopology: true, useNewUrlParser: true, maxPoolSize });

      await client.connect();

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
}
