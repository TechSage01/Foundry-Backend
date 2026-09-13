import pkg from "pg";
const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000
})

export default pool