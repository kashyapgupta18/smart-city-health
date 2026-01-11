const { Pool } = require('pg');
require('dotenv').config();

// Configuration for Local vs Cloud
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Required for Render/Cloud DBs
      }
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    };

const pool = new Pool(poolConfig);

pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Connection Error:', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('❌ Error executing query', err.stack);
    }
    console.log('✅ Connected to Database successfully!');
  });
});

module.exports = pool;