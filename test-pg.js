const { Client } = require('pg');

async function revertPasswords() {
  const url = 'postgresql://root:123456@localhost:5432/auth_db';
  const client = new Client({ connectionString: url });
  
  try {
    await client.connect();
    
    const originalHash = '$2b$10$eJxuZ.iITc7AlGkc7.H43.0MJX5LKANV6ehzCUbausCY96t.pciJW';
    
    await client.query("UPDATE users SET password = $1 WHERE email IN ('neita@420.com', 'user@tusuper.com')", [originalHash]);
    console.log('Passwords reverted to original hash.');
    
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await client.end();
  }
}

revertPasswords();
