import neo4j, { Driver, Session } from "neo4j-driver";

let driver: Driver | null = null;

/**
 * Lazily creates a single shared driver instance. CognoDB (and Neo4j) drivers
 * manage their own connection pool internally, so one Driver per process is
 * the correct lifetime — not one per request.
 */
function getDriver(): Driver {
  if (driver) return driver;

  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !user || !password) {
    throw new DbConfigError(
      "Missing NEO4J_URI, NEO4J_USER or NEO4J_PASSWORD environment variables."
    );
  }

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionPoolSize: 20,
  });

  return driver;
}

export class DbConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DbConfigError";
  }
}

export class DbConnectionError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "DbConnectionError";
  }
}

/**
 * Runs `work` with a fresh session and guarantees the session is closed.
 * Wraps driver/connectivity failures (CognoDB unreachable, bad credentials,
 * DNS failure, etc.) into a single DbConnectionError so route handlers can
 * render one consistent "database unreachable" state instead of leaking
 * raw driver errors to the client.
 */
export async function withSession<T>(
  work: (session: Session) => Promise<T>
): Promise<T> {
  let session: Session;
  try {
    session = getDriver().session();
  } catch (err) {
    if (err instanceof DbConfigError) throw err;
    throw new DbConnectionError("Could not create a database session.", err);
  }

  try {
    return await work(session);
  } catch (err) {
    if (err instanceof DbConfigError) throw err;
    throw new DbConnectionError(
      "Could not reach the CognoDB instance. It may be paused, unreachable, or the credentials are wrong.",
      err
    );
  } finally {
    await session.close();
  }
}

export async function checkConnectivity(): Promise<boolean> {
  try {
    await getDriver().verifyConnectivity();
    return true;
  } catch {
    return false;
  }
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
