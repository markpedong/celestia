import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { reconcilePendingAccountDeletions } from '@/lib/server/account-deletion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (request: Request) => {
  if (!isAuthorizedCronRequest(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return Response.json({ status: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await reconcilePendingAccountDeletions();
    return Response.json(
      { status: result.failed ? 'degraded' : 'ok', ...result },
      { status: result.failed ? 503 : 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    console.error('Account deletion reconciliation could not query pending requests.');
    return Response.json({ status: 'error' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
};
