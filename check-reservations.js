const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Parse .env file
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

async function checkReservations() {
  console.log('Connecting to MongoDB...');
  console.log('URL:', MONGO_URL);
  console.log('Database:', DB_NAME);
  console.log('');

  const client = await MongoClient.connect(MONGO_URL);
  const db = client.db(DB_NAME);

  console.log('Checking reservations collection...');
  const reservations = await db.collection('reservations').find({}).toArray();

  console.log(`Found ${reservations.length} reservation(s):\n`);

  reservations.forEach((res, index) => {
    console.log(`Reservation ${index + 1}:`);
    console.log(`  ID: ${res._id}`);
    console.log(`  Customer: ${res.customerName}`);
    console.log(`  Email: ${res.email}`);
    console.log(`  Phone: ${res.phone}`);
    console.log(`  Status: ${res.status}`);
    console.log(`  Car ID: ${res.carId}`);
    console.log(`  Start Date: ${res.startDate}`);
    console.log(`  End Date: ${res.endDate}`);
    console.log(`  Created: ${res.createdAt}`);
    console.log('');
  });

  // Count by status
  const statusCounts = {};
  reservations.forEach(res => {
    statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
  });

  console.log('Status Summary:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  console.log('\n✅ Connection successful!\n');
  await client.close();
  console.log('Connection closed.');
}

checkReservations().catch(console.error);
