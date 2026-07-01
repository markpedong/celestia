import type { EnrichedCommentNode, EnrichedCommentRow } from './types';

export const nestCommentRows = (
  flat: EnrichedCommentRow[],
): EnrichedCommentNode[] => {
  const map = new Map<string, EnrichedCommentNode>();
  for (const c of flat) {
    map.set(c.id, {
      id: c.id,
      postID: c.postID,
      parentID: c.parentID,
      body: c.body,
      createdAt: c.createdAt,
      authorID: c.authorID,
      author: c.author,
      score: c.score,
      userVote: c.userVote,
      children: [],
    });
  }

  const roots: EnrichedCommentNode[] = [];
  for (const c of flat) {
    const node = map.get(c.id);
    if (!node) continue;
    if (c.parentID && map.has(c.parentID)) {
      map.get(c.parentID)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortCh = (nodes: EnrichedCommentNode[]) => {
    nodes.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    for (const n of nodes) sortCh(n.children);
  };

  sortCh(roots);

  return roots;

};
