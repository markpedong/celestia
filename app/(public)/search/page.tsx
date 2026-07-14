import Link from 'next/link';
import type { Metadata } from 'next';
import { MessageSquare, Search, Users } from 'lucide-react';
import { searchAll } from '@/lib/db/search.queries';
import type { SearchParamsProps, SearchResultType } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search Celestia posts, comments, communities, and people.',
  robots: { index: false, follow: true },
};

const resultTypes: { value: SearchResultType; label: string }[] = [
  { value: 'posts', label: 'Posts' },
  { value: 'comments', label: 'Comments' },
  { value: 'communities', label: 'Communities' },
  { value: 'people', label: 'People' },
];

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

const searchHref = (query: string, type: SearchResultType, community: string, page = 1) => {
  const params = new URLSearchParams({ q: query, type });
  if (community && (type === 'posts' || type === 'comments')) params.set('community', community);
  if (page > 1) params.set('page', String(page));
  return `/search?${params.toString()}`;
};

const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'ig'));
  return parts.map((part, index) => part.toLowerCase() === query.toLowerCase()
    ? <mark key={index} className='rounded-sm bg-accent/25 px-0.5 text-inherit'>{part}</mark>
    : part);
};

const snippet = (value: string, length = 240) => {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > length ? `${clean.slice(0, length)}…` : clean;
};

const SearchPage = async ({ searchParams }: SearchParamsProps) => {
  const params = await searchParams;
  const query = (first(params.q) ?? '').trim().slice(0, 80);
  const rawType = first(params.type);
  const type: SearchResultType = rawType === 'comments' || rawType === 'communities' || rawType === 'people'
    ? rawType
    : 'posts';
  const community = (first(params.community) ?? '').trim().toLowerCase().slice(0, 64);
  const page = Math.max(1, Number.parseInt(first(params.page) ?? '1', 10) || 1);
  const results = await searchAll(query, { type, community, page });
  const pages = Math.max(1, Math.ceil(results.total / results.pageSize));

  return (
    <div className='mx-auto w-full max-w-4xl space-y-4'>
      <section className='celestia-card p-4 md:p-6'>
        <p className='celestia-panel-label mb-1'><Search className='size-3' /> Search Celestia</p>
        <h1 className='text-xl font-black tracking-tight md:text-2xl'>
          {query ? <>Results for &ldquo;{query}&rdquo;</> : 'Find a conversation'}
        </h1>

        <form action='/search' className='mt-4 flex flex-col gap-2 sm:flex-row'>
          <input
            name='q'
            defaultValue={query}
            maxLength={80}
            required
            aria-label='Search query'
            placeholder='Search Celestia'
            className='h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-accent'
          />
          <input type='hidden' name='type' value={type} />
          {(type === 'posts' || type === 'comments') ? (
            <input
              name='community'
              defaultValue={community}
              maxLength={64}
              aria-label='Limit to community'
              placeholder='Community (optional)'
              className='h-10 min-w-0 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-accent sm:w-52'
            />
          ) : null}
          <button className='h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground'>Search</button>
        </form>

        <nav className='mt-4 flex gap-1 overflow-x-auto border-b border-border' aria-label='Search result types'>
          {resultTypes.map(item => (
            <Link
              key={item.value}
              href={searchHref(query, item.value, community)}
              aria-current={type === item.value ? 'page' : undefined}
              className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                type === item.value ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </section>

      {!query ? (
        <section className='celestia-card grid min-h-64 place-items-center p-8 text-center'>
          <div><Search className='mx-auto mb-3 size-8 text-muted-foreground' /><p className='font-semibold'>Enter a keyword to begin.</p></div>
        </section>
      ) : (
        <section className='space-y-3' aria-live='polite'>
          <p className='px-1 text-sm text-muted-foreground'>{results.total.toLocaleString()} {type} found</p>

          {results.posts.map(post => (
            <article key={post.id} className='celestia-card celestia-card-hover p-4 md:p-5'>
              <div className='mb-2 flex flex-wrap gap-x-2 text-xs text-muted-foreground'>
                {post.tagSlugs.slice(0, 2).map(tag => <Link key={tag} href={`/r/${encodeURIComponent(tag)}`} className='font-semibold hover:underline'>r/{tag}</Link>)}
                <span>{post.author ? <Link href={`/u/${encodeURIComponent(post.author.userName)}`} className='hover:underline'>u/{post.author.userName}</Link> : '[deleted]'}</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <Link href={`/post/${post.id}`}><h2 className='text-lg font-bold hover:underline'><Highlight text={post.title} query={query} /></h2></Link>
              <p className='mt-2 text-sm leading-6 text-muted-foreground'><Highlight text={snippet(post.body)} query={query} /></p>
              <Link href={`/post/${post.id}`} className='mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground'>
                <MessageSquare className='size-3.5' /> {post.commentCount} comments
              </Link>
            </article>
          ))}

          {results.comments.map(comment => (
            <article key={comment.id} className='celestia-card celestia-card-hover p-4 md:p-5'>
              <p className='text-xs text-muted-foreground'>
                {comment.author ? <Link href={`/u/${encodeURIComponent(comment.author.userName)}`} className='font-semibold hover:underline'>u/{comment.author.userName}</Link> : '[deleted]'} commented on{' '}
                <Link href={`/post/${comment.postID}`} className='font-semibold hover:underline'>{comment.postTitle}</Link>
              </p>
              <Link href={`/post/${comment.postID}#comment-${comment.id}`} className='mt-2 block text-sm leading-6 hover:underline'>
                <Highlight text={snippet(comment.body)} query={query} />
              </Link>
            </article>
          ))}

          {results.communities.map(item => (
            <Link key={item.slug} href={`/r/${encodeURIComponent(item.slug)}`} className='celestia-card celestia-card-hover flex items-start gap-3 p-4 md:p-5'>
              <span className='grid size-10 shrink-0 place-items-center rounded-full text-sm font-black text-white' style={{ backgroundColor: item.hashColor }}>{item.label.slice(0, 1).toUpperCase()}</span>
              <span className='min-w-0 flex-1'>
                <span className='block font-bold'>r/<Highlight text={item.slug} query={query} /></span>
                <span className='mt-1 block text-sm text-muted-foreground'><Highlight text={snippet(item.description, 180)} query={query} /></span>
                <span className='mt-2 block text-xs text-muted-foreground'>{item.memberCount} members · {item.postCount} posts</span>
              </span>
            </Link>
          ))}

          {results.people.map(person => (
            <Link key={person.id} href={`/u/${encodeURIComponent(person.userName)}`} className='celestia-card celestia-card-hover flex items-start gap-3 p-4 md:p-5'>
              <span className='grid size-10 shrink-0 place-items-center rounded-full bg-secondary font-bold'><Users className='size-4' /></span>
              <span className='min-w-0'>
                <span className='block font-bold'><Highlight text={person.displayName || person.userName} query={query} /></span>
                <span className='block text-sm text-muted-foreground'>u/<Highlight text={person.userName} query={query} /></span>
                {person.bio ? <span className='mt-2 block text-sm text-muted-foreground'><Highlight text={snippet(person.bio, 180)} query={query} /></span> : null}
              </span>
            </Link>
          ))}

          {results.total === 0 ? (
            <div className='celestia-card grid min-h-56 place-items-center p-8 text-center'>
              <div><Search className='mx-auto mb-3 size-8 text-muted-foreground' /><p className='font-semibold'>No matching {type}.</p><p className='mt-1 text-sm text-muted-foreground'>Try a broader keyword or remove the community filter.</p></div>
            </div>
          ) : null}
        </section>
      )}

      {query && pages > 1 ? (
        <nav className='flex items-center justify-between py-3 text-sm' aria-label='Search result pages'>
          {results.page > 1 ? <Link href={searchHref(query, type, community, results.page - 1)} className='rounded-md border border-border px-4 py-2 font-semibold hover:bg-secondary'>Previous</Link> : <span />}
          <span className='text-muted-foreground'>Page {Math.min(results.page, pages)} of {pages}</span>
          {results.page < pages ? <Link href={searchHref(query, type, community, results.page + 1)} className='rounded-md border border-border px-4 py-2 font-semibold hover:bg-secondary'>Next</Link> : <span />}
        </nav>
      ) : null}
    </div>
  );
};

export default SearchPage;
