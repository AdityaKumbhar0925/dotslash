import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;
  const crack = dataStore.incidents.find((i: any) => i.id === id);
  if (crack) {
    crack.status = 'scheduled';
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
