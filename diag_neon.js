const { Pool } = require('@neondatabase/serverless');
require('dotenv').config({ path: './apps/web/.env' });

const rawUrl = process.env.DATABASE_URL;
console.log('Diagnostic URL:', rawUrl ? 'PRESENT' : 'MISSING', 'LENGTH:', rawUrl?.length);

try {
  const connectionString = `${rawUrl}`;
  console.log('ConnectionString starts with postgresql?', connectionString.startsWith('postgresql'));
  
  const pool = new Pool({ connectionString });
  console.log('Pool created successfully');
  
  // We won't actually query here as we don't want to hang, 
  // but we can check if it throws on creation or if we can see internal config if any
} catch (err) {
  console.error('Neon Pool Creation Failed:', err);
}
