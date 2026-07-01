'use client';

import type { FC } from 'react';
import type { CommentSubmitResult, CommentThreadProps, EnrichedCommentNode, PendingCommentInput } from '@/lib/types';
import { CommentNode } from './comment-node';
import { CommentSubmissionContext, createPendingComment } from './comment-submission-context';
import { useRouter } from 'next/navigation';
import { useMemo, useOptimistic, useState, useTransition } from 'react';
import { useCreateComment } from '@/hooks/useQueries';
import { BarChart2, ChevronDown, Clock, Rocket, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import styles from './comment-thread.module.scss';

type CommentSort = 'best' | 'top' | 'new';

const sortOptions: { id: CommentSort; label: string; icon: typeof Rocket }[] = [
  { id: 'best', label: 'Best', icon: Rocket },
  { id: 'top', label: 'Top', icon: BarChart2 },
  { id: 'new', label: 'New', icon: Clock },
];

const CommentThread: FC<CommentThreadProps> = ({ tree, postAuthorID, sessionUser, communitySlug, children }) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const createCommentMutation = useCreateComment();
  const [activeReplyID, setActiveReplyID] = useState<string | null>(null);
  const [sort, setSort] = useState<CommentSort>('best');
  const [query, setQuery] = useState('');
  const [optimisticTree, addOptimisticComment] = useOptimistic(
    tree,
    (currentTree, pendingComment: EnrichedCommentNode) => appendComment(currentTree, pendingComment)
  );
  const visibleTree = useMemo(() => prepareCommentTree(optimisticTree, sort, query), [optimisticTree, sort, query]);
  const activeSort = sortOptions.find(option => option.id === sort) ?? sortOptions[0];
  const ActiveSortIcon = activeSort.icon;

  const submitComment = (pendingComment: PendingCommentInput) =>
    new Promise<CommentSubmitResult>(resolve => {
      startTransition(async () => {
        addOptimisticComment(createPendingComment(pendingComment));
        const result = await createCommentMutation.mutateAsync(pendingComment);
        if (result?.ok) {
          setActiveReplyID(null);
          router.refresh();
        }
        resolve(result);
      });
    });

  return (
    <CommentSubmissionContext value={{ submitComment, pending: pending || createCommentMutation.isPending }}>
      {children}
      <div className={styles.toolbar}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type='button' className={styles.sortButton}>
              <span className={styles.sortLabel}>Sort by</span>
              <ActiveSortIcon className={styles.controlIcon} />
              {activeSort.label}
              <ChevronDown className={styles.chevron} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={styles.sortMenu}>
            {sortOptions.map(({ id, label, icon: Icon }) => (
              <DropdownMenuItem key={id} onSelect={() => setSort(id)} className={styles.sortItem}>
                <Icon className={styles.controlIcon} />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <label className={styles.searchBox}>
          <Search className={styles.searchIcon} />
          <Input
            type='search'
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder='Search comments'
            className={styles.searchInput}
          />
        </label>
      </div>
      <CommentTree
        tree={visibleTree}
        postAuthorID={postAuthorID}
        sessionUser={sessionUser}
        communitySlug={communitySlug}
        activeReplyID={activeReplyID}
        onReplyChangeAction={setActiveReplyID}
      />
    </CommentSubmissionContext>
  );
};

const CommentTree: FC<Omit<CommentThreadProps, 'children'> & {
  activeReplyID: string | null;
  onReplyChangeAction: (commentID: string | null) => void;
}> = ({ tree, postAuthorID, sessionUser, communitySlug, activeReplyID, onReplyChangeAction }) => (
  <ul className={styles.list}>
    {tree.map(node => (
      <CommentNode
        key={node.id}
        node={node}
        postAuthorID={postAuthorID}
        sessionUser={sessionUser}
        communitySlug={communitySlug}
        activeReplyID={activeReplyID}
        onReplyChangeAction={onReplyChangeAction}
      />
    ))}
  </ul>
);

const appendComment = (tree: EnrichedCommentNode[], comment: EnrichedCommentNode): EnrichedCommentNode[] => {
  if (!comment.parentID) return [...tree, comment];

  for (let index = 0; index < tree.length; index += 1) {
    const node = tree[index];
    if (node.id === comment.parentID) {
      return tree.map((candidate, candidateIndex) =>
        candidateIndex === index ? { ...candidate, children: [...candidate.children, comment] } : candidate
      );
    }

    const children = appendComment(node.children, comment);
    if (children !== node.children) {
      return tree.map((candidate, candidateIndex) =>
        candidateIndex === index ? { ...candidate, children } : candidate
      );
    }
  }

  return tree;
};

const prepareCommentTree = (
  tree: EnrichedCommentNode[],
  sort: CommentSort,
  query: string,
): EnrichedCommentNode[] => {
  const normalizedQuery = query.trim().toLowerCase();

  const visit = (nodes: EnrichedCommentNode[]): EnrichedCommentNode[] => {
    const filtered = nodes.flatMap(node => {
      const children = visit(node.children);
      const text = `${node.body} ${node.author.displayName ?? ''} ${node.author.userName}`.toLowerCase();
      if (normalizedQuery && !text.includes(normalizedQuery) && children.length === 0) return [];
      return [{ ...node, children }];
    });

    return filtered.sort((a, b) => {
      if (sort === 'new') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      const scoreDelta = b.score - a.score;
      if (scoreDelta !== 0) return scoreDelta;
      return sort === 'top'
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  return visit(tree);
};

export default CommentThread;
