import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';

export async function GET() {
  const auditPath = "c:\\Users\\USER\\git-pulse\\apps\\web\\prisma_audit.log";
  const url = process.env.DATABASE_URL!;
  fs.appendFileSync(auditPath, `🔍 [API DB Test] Starting raw neon test. URL Len: ${url.length}\n`);

  try {
    const sql = neon(url);
    const result = await sql`SELECT 1 as test`;
    fs.appendFileSync(auditPath, `✅ [API DB Test] Raw neon success: ${JSON.stringify(result)}\n`);
    
    const userCount = await prisma.user.count();
    return NextResponse.json({ success: true, userCount, rawResult: result });
  } catch (error) {
    console.error('❌ [API Test] Database Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
