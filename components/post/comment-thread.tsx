import { User } from '@/lib/types';
import { EnrichedCommentNode } from '@/lib/comment-tree';
import { CommentNode } from './comment-node';

const CommentThread = ({
  tree,
  postAuthorId,
  sessionUser,
}: {
  tree: EnrichedCommentNode[];
  postAuthorId: string;
  sessionUser: User | null;
}) => {
  if (tree.length === 0) {
    return (
      <div className='rounded-xl border border-dashed border-border bg-secondary/30 px-6 py-12 text-center'>
        <p className='text-sm font-medium text-muted-foreground'>No replies on this post yet.</p>
        <p className='mt-1 text-xs text-muted-foreground/70'>Be the first to add context to the thread.</p>
      </div>
    );
  }

  return (
    <ul className='space-y-4'>
      {tree.map(node => (
        <CommentNode key={node.id} node={node} postAuthorId={postAuthorId} sessionUser={sessionUser} />
      ))}
    </ul>
  );
};

export default CommentThread;
