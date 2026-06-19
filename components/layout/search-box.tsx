'use client';

import type { TrendingItem } from '@/lib/trending';
import type { SearchPostSuggestion, SearchTagSuggestion } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Clock, Hash, Search, TrendingUp, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, MouseEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

type SearchResponse = {
  posts: SearchPostSuggestion[];
  tags: SearchTagSuggestion[];
};

type Props = {
  trending: TrendingItem[];
  communities: SearchTagSuggestion[];
};

const RECENT_SEARCHES_KEY = 'celestia:recent-searches';

const readRecentSearches = (): string[] => {
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const writeRecentSearches = (items: string[]) => {
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items.slice(0, 6)));
};

const getSnippet = (body: string) => {
  const clean = body.replace(/\s+/g, ' ').trim();
  return clean.length > 82 ? `${clean.slice(0, 82)}...` : clean;
};

const SearchBox = ({ trending, communities }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResponse>({ posts: [], tags: [] });

  const trimmedQuery = query.trim();
  const typedSuggestions = useMemo(() => {
    if (!trimmedQuery) return [];

    const base = [
      trimmedQuery,
      `${trimmedQuery} discussion`,
      `${trimmedQuery} question`,
      `${trimmedQuery} updates`,
      `${trimmedQuery} advice`,
    ];

    return [...new Set(base)].slice(0, 5);
  }, [trimmedQuery]);

  useEffect(() => {
    queueMicrotask(() => {
      setRecentSearches(readRecentSearches());
      setQuery(new URLSearchParams(window.location.search).get('q') ?? '');
    });
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!trimmedQuery) {
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as SearchResponse;
        setSuggestions(data);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setSuggestions({ posts: [], tags: [] });
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmedQuery]);

  const saveRecentSearch = (term: string) => {
    const next = [term, ...recentSearches.filter(item => item.toLowerCase() !== term.toLowerCase())].slice(0, 6);
    setRecentSearches(next);
    writeRecentSearches(next);
  };

  const runSearch = (term = trimmedQuery) => {
    const nextQuery = term.trim();
    if (!nextQuery) return;

    saveRecentSearch(nextQuery);
    setQuery(nextQuery);
    setIsOpen(false);
    const searchPath = pathname.startsWith('/r/') ? pathname : '/';
    router.push(`${searchPath}?q=${encodeURIComponent(nextQuery)}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch();
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions({ posts: [], tags: [] });
    inputRef.current?.focus();
  };

  const removeRecentSearch = (event: MouseEvent<HTMLButtonElement>, term: string) => {
    event.preventDefault();
    event.stopPropagation();
    const next = recentSearches.filter(item => item !== term);
    setRecentSearches(next);
    writeRecentSearches(next);
  };

  return (
    <div ref={rootRef} className='relative mx-auto min-w-0 max-w-2xl flex-1'>
      <form
        onSubmit={handleSubmit}
        className={cn(
          'group/search flex h-10 items-center overflow-hidden rounded-[22px] border bg-secondary/80 text-sm transition-colors',
          isOpen ? 'border-accent shadow-[0_0_0_1px_var(--accent)]' : 'border-border/80 hover:border-border'
        )}
      >
        <button
          type='button'
          onClick={() => router.push('/')}
          className='grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground'
          aria-label='Go home'
        >
          <Zap className='size-4 fill-current' />
        </button>
        <input
          ref={inputRef}
          value={query}
          onChange={event => setQuery(event.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder='Find anything'
          aria-label='Search posts'
          className='h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground'
        />
        {query ? (
          <button
            type='button'
            onClick={clearQuery}
            className='grid size-9 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground'
            aria-label='Clear search'
          >
            <X className='size-4' />
          </button>
        ) : null}
        <span className='h-6 w-px bg-border/80' aria-hidden />
      </form>

      {isOpen ? (
        <div className='absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-b-[24px] rounded-t-md border border-border/90 bg-popover py-3 text-sm text-popover-foreground shadow-2xl shadow-foreground/10'>
          {!trimmedQuery ? (
            <div className='max-h-[min(72vh,720px)] overflow-y-auto'>
              <SearchSection title='Recent'>
                {recentSearches.length ? (
                  recentSearches.map(term => (
                    <div
                      key={term}
                      className='flex items-center gap-4 px-5 py-3 text-[15px] text-popover-foreground celestia-hover-surface'
                    >
                      <button
                        type='button'
                        onClick={() => runSearch(term)}
                        className='flex min-w-0 flex-1 items-center gap-4 text-left'
                      >
                        <Clock className='size-5 shrink-0 text-muted-foreground' />
                        <span className='min-w-0 flex-1 truncate'>{term}</span>
                      </button>
                      <button
                        type='button'
                        onClick={event => removeRecentSearch(event, term)}
                        className='grid size-7 place-items-center text-muted-foreground transition-colors hover:text-foreground'
                        aria-label={`Remove ${term} from recent searches`}
                      >
                        <X className='size-4' />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className='px-5 py-3 text-sm text-muted-foreground'>No recent searches yet.</p>
                )}
              </SearchSection>

              <SearchSection title='Trending'>
                {trending.map(item => (
                  <button
                    key={item.rank}
                    type='button'
                    onClick={() => runSearch(item.title)}
                    className='flex w-full items-center gap-4 px-5 py-3 text-left celestia-hover-surface'
                  >
                    <TrendingUp className='size-5 shrink-0 text-popover-foreground' />
                    <span className='min-w-0'>
                      <span className='block truncate text-[15px] text-popover-foreground'>{item.title}</span>
                      <span className='block truncate text-xs text-muted-foreground'>
                        Based on what people are discussing
                      </span>
                    </span>
                  </button>
                ))}
              </SearchSection>

              <SearchSection title='Trending communities'>
                {communities.map(community => (
                  <Link
                    key={community.slug}
                    href={`/r/${encodeURIComponent(community.slug)}`}
                    onClick={() => setIsOpen(false)}
                    className='flex items-center gap-4 px-5 py-2.5 celestia-hover-surface'
                  >
                    <span
                      className='grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-primary-foreground'
                      style={{ backgroundColor: community.hashColor }}
                    >
                      {community.label.slice(0, 1).toUpperCase()}
                    </span>
                    <span className='min-w-0'>
                      <span className='block truncate text-[15px] text-popover-foreground'>r/{community.slug}</span>
                      <span className='block truncate text-xs text-muted-foreground'>
                        {community.postCount} posts in this topic
                      </span>
                    </span>
                  </Link>
                ))}
              </SearchSection>
            </div>
          ) : (
            <div className='max-h-[min(68vh,620px)] overflow-y-auto'>
              <div className='border-b border-border/60 pb-2'>
                {typedSuggestions.map(term => (
                  <button
                    key={term}
                    type='button'
                    onClick={() => runSearch(term)}
                    className='flex w-full items-center gap-4 px-5 py-3 text-left celestia-hover-surface'
                  >
                    <Search className='size-5 shrink-0 text-popover-foreground' />
                    <span className='truncate text-[15px] font-semibold text-popover-foreground'>{term}</span>
                  </button>
                ))}
              </div>

              <SearchSection title='Communities'>
                {suggestions.tags.map(tag => (
                  <Link
                    key={tag.slug}
                    href={`/r/${encodeURIComponent(tag.slug)}?q=${encodeURIComponent(trimmedQuery)}`}
                    onClick={() => {
                      saveRecentSearch(trimmedQuery);
                      setIsOpen(false);
                    }}
                    className='flex items-center gap-4 px-5 py-2.5 celestia-hover-surface'
                  >
                    <span
                      className='grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-primary-foreground'
                      style={{ backgroundColor: tag.hashColor }}
                    >
                      {tag.label.slice(0, 1).toUpperCase()}
                    </span>
                    <span className='min-w-0'>
                      <span className='block truncate text-[15px] text-popover-foreground'>r/{tag.slug}</span>
                      <span className='block truncate text-xs text-muted-foreground'>
                        {tag.postCount} posts in this topic
                      </span>
                    </span>
                  </Link>
                ))}
                {suggestions.posts.map(post => (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    onClick={() => {
                      saveRecentSearch(trimmedQuery);
                      setIsOpen(false);
                    }}
                    className='flex items-start gap-4 px-5 py-3 celestia-hover-surface'
                  >
                    <Hash className='mt-0.5 size-5 shrink-0 text-popover-foreground' />
                    <span className='min-w-0'>
                      <span className='block truncate text-[15px] font-semibold text-popover-foreground'>
                        {post.title}
                      </span>
                      <span className='block truncate text-xs text-muted-foreground'>{getSnippet(post.body)}</span>
                    </span>
                  </Link>
                ))}
                {suggestions.tags.length === 0 && suggestions.posts.length === 0 ? (
                  <button
                    type='button'
                    onClick={() => runSearch()}
                    className='flex w-full items-center gap-4 px-5 py-3 text-left celestia-hover-surface'
                  >
                    <Search className='size-5 shrink-0 text-popover-foreground' />
                    <span className='text-[15px] text-popover-foreground'>Search for &quot;{trimmedQuery}&quot;</span>
                  </button>
                ) : null}
              </SearchSection>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

const SearchSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className='py-1'>
    <h2 className='px-5 py-2 text-xs font-semibold text-muted-foreground'>{title}</h2>
    {children}
  </section>
);

export default SearchBox;
