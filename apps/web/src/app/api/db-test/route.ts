import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log("🔍 [API DB Test] DATABASE_URL Defined?", !!process.env.DATABASE_URL);
  console.log("🔍 [API DB Test] DATABASE_URL Length:", process.env.DATABASE_URL?.length);
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ success: true, userCount });
  } catch (error) {
    console.error('❌ [API Test] Database Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
