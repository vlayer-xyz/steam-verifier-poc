import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let db: ReturnType<typeof drizzle> | null = null

export function getDatabase() {
  if (!process.env.DATABASE_URL) {
    return null
  }

  if (!db) {
    const connection = postgres(process.env.DATABASE_URL)
    db = drizzle(connection, { schema })
  }

  return db
}

export function isDatabaseEnabled(): boolean {
  return !!process.env.DATABASE_URL
}

export { schema }