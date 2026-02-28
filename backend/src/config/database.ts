import { Pool, PoolClient } from "pg";
import logger from "../utils/logger";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host:     process.env.PGHOST     ?? "localhost",
  port:     parseInt(process.env.PGPORT ?? "5432", 10),
  user:     process.env.PGUSER     ?? "postgres",
  password: process.env.PGPASSWORD ?? "",
  database: process.env.PGDATABASE ?? "cab_booking",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  logger.error("Unexpected PostgreSQL pool error:", err);
});

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development") {
      logger.debug(`DB query executed in ${duration}ms: ${text.slice(0, 80)}`);
    }
    return result as { rows: T[]; rowCount: number | null };
  } catch (err) {
    logger.error("DB query error:", { text, error: err });
    throw err;
  }
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Run queries inside a transaction. Rolls back automatically on error.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function testConnection(): Promise<void> {
  try {
    const result = await query<{ now: string }>("SELECT NOW() AS now");
    logger.info(`✅ PostgreSQL connected at ${result.rows[0].now}`);
  } catch (err) {
    logger.error("❌ PostgreSQL connection failed:", err);
    throw err;
  }
}

export default pool;
