import { NextResponse } from 'next/server';

/**
 * Retorna a URL da API OpenClaw para o frontend.
 * Usado pelo resolveApiBaseUrl() em lib/api/config.js
 */
export async function GET() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:3010';
  return NextResponse.json({ apiUrl });
}
