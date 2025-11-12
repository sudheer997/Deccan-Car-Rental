// Test password hashing and verification
function hashPassword(password) {
  return Buffer.from(password).toString('base64');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

const testPassword = 'admin123';
const storedHash = 'YWRtaW4xMjM=';

console.log('Testing password verification...');
console.log('Password to test:', testPassword);
console.log('Stored hash:', storedHash);
console.log('Generated hash:', hashPassword(testPassword));
console.log('Hashes match:', verifyPassword(testPassword, storedHash));
console.log('\nResult:', verifyPassword(testPassword, storedHash) ? '✅ Password is correct!' : '❌ Password does not match');
