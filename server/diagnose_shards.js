const net = require('net');
const mongoose = require('mongoose');

const shards = [
    { name: 'Shard 00', host: 'ac-jkzrhhv-shard-00-00.pughucv.mongodb.net', port: 27017 },
    { name: 'Shard 01', host: 'ac-jkzrhhv-shard-00-01.pughucv.mongodb.net', port: 27017 },
    { name: 'Shard 02', host: 'ac-jkzrhhv-shard-00-02.pughucv.mongodb.net', port: 27017 }
];

const checkPort = (host, port) => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000); // 3s timeout

        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });

        socket.on('error', (err) => {
            resolve(false);
        });

        socket.connect(port, host);
    });
};

const checkMongo = async (host, port) => {
    // Construct simplified URI for direct connection
    // We use the hosts file mapped names
    const uri = `mongodb://Chaurasiya123:MlEsmEXApOktPbes@${host}:${port}/transport_db?authSource=admin&directConnection=true&tls=true`;

    try {
        const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 }).asPromise();
        const hello = await conn.db.admin().command({ hello: 1 });
        await conn.close();
        return { success: true, isPrimary: hello.isWritablePrimary, state: hello.me };
    } catch (err) {
        return { success: false, error: err.message };
    }
};

async function diagnose() {
    console.log('=== Granular Shard Connectivity Diagnosis ===\n');
    let reachableCount = 0;

    for (const shard of shards) {
        process.stdout.write(`Testing ${shard.name} (${shard.host})... `);
        const start = Date.now();
        const isTcpOpen = await checkPort(shard.host, shard.port);

        if (isTcpOpen) {
            console.log(`✅ TCP OK (${Date.now() - start}ms)`);
            process.stdout.write(`  ↳ Checking MongoDB Auth & State... `);
            const mongoStatus = await checkMongo(shard.host, shard.port);

            if (mongoStatus.success) {
                console.log(`✅ AUTH OK`);
                console.log(`    Role: ${mongoStatus.isPrimary ? '🌟 PRIMARY' : '⚪ SECONDARY'}`);
                reachableCount++;
            } else {
                console.log(`❌ AUTH FAIL: ${mongoStatus.error}`);
            }
        } else {
            console.log(`❌ TCP BLOCKED (Timeout/Error)`);
        }
        console.log('');
    }

    console.log('--- Summary ---');
    if (reachableCount === 0) {
        console.log('⛔ COMPLETE BLOCKAGE: No shards are reachable.');
    } else if (reachableCount < 3) {
        console.log('⚠️  PARTIAL BLOCKAGE: Some shards are unreachable.');
    } else {
        console.log('✅ ALL SYSTEMS GO: Network looks perfect.');
    }

    process.exit(0);
}

diagnose();
