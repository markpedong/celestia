import { getPostByID } from '@/lib/db/queries';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostByID(id);
  return post ? NextResponse.json(post) : NextResponse.json({ error: 'Post not found.' }, { status: 404 });
}
