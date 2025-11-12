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
const DB_NAME = envVars.DB_NAME || 'car_rental_db';

async function checkAdmin() {
  let client;
  try {
    console.log('Connecting to MongoDB...');
    console.log('URL:', MONGO_URL);
    console.log('Database:', DB_NAME);

    client = await MongoClient.connect(MONGO_URL);
    const db = client.db(DB_NAME);

    console.log('\nChecking admins collection...');
    const admins = await db.collection('admins').find({}).toArray();

    if (admins.length === 0) {
      console.log('No admin users found in the database.');
      console.log('The app will create a default admin when you login with:');
      console.log('  Username: admin');
      console.log('  Password: admin123');
    } else {
      console.log(`Found ${admins.length} admin(s):`);
      admins.forEach((admin, index) => {
        console.log(`\nAdmin ${index + 1}:`);
        console.log('  ID:', admin._id);
        console.log('  Username:', admin.username);
        console.log('  Password Hash:', admin.password);
        console.log('  Created:', admin.createdAt);
      });
    }

    console.log('\n✅ Connection successful!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\nConnection closed.');
    }
  }
}

checkAdmin();
