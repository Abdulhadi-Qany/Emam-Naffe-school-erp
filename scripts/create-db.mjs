import { Client } from 'pg'

const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres' })

async function main() {
  await client.connect()
  const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = 'ebps_erp'")
  if (existing.rowCount === 0) {
    await client.query('CREATE DATABASE "ebps_erp"')
    console.log('Database ebps_erp created')
  } else {
    console.log('Database ebps_erp already exists')
  }
  await client.end()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
