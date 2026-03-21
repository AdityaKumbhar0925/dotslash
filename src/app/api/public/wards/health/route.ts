import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/dataStore';

export async function GET() {
  return NextResponse.json(dataStore.wards);
}
