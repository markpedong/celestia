/** HTTP health responses are deliberately free of exception messages and host details. */
export type HealthDependencies = {
  database: () => Promise<unknown>;
  auth: () => Promise<unknown>;
  cache?: () => Promise<unknown>;
};

const probe = async (check: () => Promise<unknown>, timeoutMs: number): Promise<'ok' | 'error'> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.resolve().then(check),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Health check timed out.')), timeoutMs);
      }),
    ]);
    return 'ok';
  } catch {
    return 'error';
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const headers = { 'Cache-Control': 'no-store' };

export const livenessResponse = () => Response.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  probe: 'liveness',
}, { status: 200, headers });

export const readinessResponse = async (dependencies: HealthDependencies, timeoutMs = 2000) => {
  const [database, auth, cache] = await Promise.all([
    probe(dependencies.database, timeoutMs),
    probe(dependencies.auth, timeoutMs),
    dependencies.cache ? probe(dependencies.cache, timeoutMs) : Promise.resolve('skipped' as const),
  ]);
  const ready = database === 'ok' && auth === 'ok';
  const status = !ready ? 'error' : cache === 'error' ? 'degraded' : 'ok';

  return Response.json({
    status,
    timestamp: new Date().toISOString(),
    probe: 'readiness',
    dependencies: { database, auth, cache },
  }, { status: ready ? 200 : 503, headers });
};
