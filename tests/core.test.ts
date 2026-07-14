import assert from 'node:assert/strict';
import test from 'node:test';
import { nestCommentRows } from '@/lib/comment-tree';
import { commentSchema, postSchema } from '@/lib/form-schemas';
import { isOwnedPublicFileUrl, parsePublicFileUrl } from '@/lib/storage';
import type { EnrichedCommentRow, User, VoteValue } from '@/lib/types';
import { desiredVoteAfterClick, reconcileVote } from '@/lib/vote-reconciliation';

test('rapid vote changes reconcile to the latest desired value', async () => {
  let desired: VoteValue = 1;
  const submitted: VoteValue[] = [];
  const final = await reconcileVote({ score: 0, userVote: 0 }, () => desired, async value => {
    submitted.push(value);
    if (submitted.length === 1) desired = -1;
    return { score: value, userVote: value };
  });

  assert.deepEqual(submitted, [1, -1]);
  assert.deepEqual(final, { score: -1, userVote: -1 });
  assert.equal(desiredVoteAfterClick(1, 1), 0);
  assert.equal(desiredVoteAfterClick(-1, 1), 1);
});

test('storage URLs support the custom domain and enforce object ownership', () => {
  const custom = 'https://files.ivory.atlascelestia.site/post-images/user-1/photo.webp';
  const legacy = 'https://vmqvrslwbsdsfcyvocfm.supabase.co/storage/v1/object/public/post-images/user-1/photo.webp';
  assert.deepEqual(parsePublicFileUrl(custom), { bucket: 'post-images', path: 'user-1/photo.webp' });
  assert.deepEqual(parsePublicFileUrl(legacy), { bucket: 'post-images', path: 'user-1/photo.webp' });
  assert.equal(isOwnedPublicFileUrl(custom, 'post-images', 'user-1'), true);
  assert.equal(isOwnedPublicFileUrl(custom, 'post-images', 'user-2'), false);
  assert.equal(isOwnedPublicFileUrl(custom, 'profile-avatars', 'user-1'), false);
});

test('comment rows retain arbitrary nesting and place orphans at the root', () => {
  const author: User = {
    id: 'user-1', userName: 'tester', displayName: 'Tester', email: 'test@example.com', bio: null,
    avatarUrl: null, coverUrl: null, createdAt: new Date(0),
  };
  const row = (id: string, parentID: string | null, createdAt: string): EnrichedCommentRow => ({
    id, postID: '00000000-0000-0000-0000-000000000001', authorID: author.id, parentID,
    body: id, createdAt, editedAt: null, deletedAt: null, author, score: 0, userVote: 0,
  });
  const tree = nestCommentRows([
    row('child', 'root', '2026-01-02T00:00:00.000Z'),
    row('deep', 'child', '2026-01-03T00:00:00.000Z'),
    row('orphan', 'missing', '2026-01-04T00:00:00.000Z'),
    row('root', null, '2026-01-01T00:00:00.000Z'),
  ]);

  assert.deepEqual(tree.map(node => node.id), ['root', 'orphan']);
  assert.equal(tree[0]?.children[0]?.children[0]?.id, 'deep');
});

test('server schemas reject empty comments and malformed posts', () => {
  assert.equal(commentSchema.safeParse({ body: '   ' }).success, false);
  assert.equal(postSchema.safeParse({ title: 'abc', body: '', communitySlug: 'space' }).success, false);
  assert.equal(postSchema.safeParse({ title: 'A valid title', body: '', communitySlug: 'space' }).success, true);
});
