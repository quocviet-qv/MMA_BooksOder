require('dotenv').config({ quiet: true });
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
async function start() {
  let localDatabase;
  if (process.env.LOCAL_PREVIEW === '1') {
    const { MongoMemoryReplSet } = require('mongodb-memory-server');
    const directory = path.resolve(__dirname, '../.local-data/mongo');
    fs.mkdirSync(directory, { recursive: true });
    // Replica-set member addresses are persisted in MongoDB. Reuse the same port
    // across starts so the saved database can elect its primary again.
    const portFile = path.resolve(directory, '../mongo-port');
    const mongoPort = fs.existsSync(portFile) ? Number(fs.readFileSync(portFile, 'utf8')) : 27018;
    if (!Number.isInteger(mongoPort) || mongoPort < 1024 || mongoPort > 65535) throw new Error('Invalid local MongoDB port');
    const probe = require('node:net').createServer();
    await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(mongoPort, '127.0.0.1', () => probe.close(resolve)); });
    fs.writeFileSync(portFile, String(mongoPort));
    localDatabase = await MongoMemoryReplSet.create({ instanceOpts: [{ dbPath: directory, port: mongoPort, args: ['--wiredTigerCacheSizeGB', '0.25'] }], replSet: { count: 1, storageEngine: 'wiredTiger' } });
    if (localDatabase.servers[0].instanceInfo.port !== mongoPort) {
      await localDatabase.stop({ doCleanup: false });
      throw new Error(`Local MongoDB port ${mongoPort} is busy. Close the previous preview process.`);
    }
    await mongoose.connect(localDatabase.getUri(), { dbName: 'bookstore_preview' });
    const secretFile = path.resolve(directory, '../jwt-secret');
    if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(48).toString('hex'));
    process.env.JWT_SECRET = fs.readFileSync(secretFile, 'utf8');
    await require('./seeders/seedPreview')();
  } else {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_bookstore_2026';
    await require('./config/db')();
  }
  const server = require('./app').listen(process.env.PORT || 3000, '0.0.0.0', () => console.log(`Bookstore API: http://localhost:${process.env.PORT || 3000} (${localDatabase ? 'local preview' : 'configured database'})`));
  const stop = async () => { server.close(); await mongoose.disconnect(); if (localDatabase) await localDatabase.stop(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
start().catch(error => { console.error(error.message); process.exit(1); });
