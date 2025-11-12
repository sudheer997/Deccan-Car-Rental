const { MongoClient } = require('mongodb');

// Read .env file manually
const fs = require('fs');
const path = require('path');
const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const MONGO_URL = envVars.MONGO_URL;
const DB_NAME = envVars.DB_NAME || 'your_database_name';

function hashPassword(password) {
  return Buffer.from(password).toString('base64');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function createToken(userId, username) {
  return Buffer.from(JSON.stringify({ userId, username, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64');
}

async function testLogin() {
  let client;
  try {
    console.log('Testing login with credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('');

    client = await MongoClient.connect(MONGO_URL);
    const db = client.db(DB_NAME);

    const username = 'admin';
    const password = 'admin123';

    console.log('Looking up admin in database...');
    const admin = await db.collection('admins').findOne({ username });

    if (!admin) {
      console.log('❌ Admin not found in database');
      return;
    }

    console.log('✅ Admin found!');
    console.log('  Username:', admin.username);
    console.log('  Password hash:', admin.password);
    console.log('');

    console.log('Verifying password...');
    const passwordMatch = verifyPassword(password, admin.password);

    if (!passwordMatch) {
      console.log('❌ Password does not match!');
      console.log('  Input password hash:', hashPassword(password));
      console.log('  Stored password hash:', admin.password);
      return;
    }

    console.log('✅ Password matches!');
    console.log('');

    const token = createToken(admin._id, admin.username);
    console.log('✅ Login successful!');
    console.log('Token:', token);
    console.log('');
    console.log('You should be able to login with:');
    console.log('  Username: admin');
    console.log('  Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

testLogin();
