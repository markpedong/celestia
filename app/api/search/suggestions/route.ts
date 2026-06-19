import { searchSuggestions } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';
  const suggestions = await searchSuggestions(query);

  return NextResponse.json(suggestions);
};
