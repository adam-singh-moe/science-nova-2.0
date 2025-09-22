import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/server-supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bucket = searchParams.get('bucket');
    const path = searchParams.get('path');

    if (!bucket || !path) {
      return NextResponse.json({ error: 'Missing bucket or path' }, { status: 400 });
    }

    // Get cookies to check authentication
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('supabase.auth.token') || 
                      cookieStore.get('sb-access-token') ||
                      cookieStore.get('sb-refresh-token');
    
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized - No auth cookie' }, { status: 401 });
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Get the file from Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      console.error('Storage download error:', error);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Convert blob to buffer
    const buffer = await data.arrayBuffer();

    // Set proper headers for PDF viewing
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', 'inline');
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('Content-Security-Policy', "frame-ancestors 'self'");
    
    // Add cache headers for better performance
    headers.set('Cache-Control', 'public, max-age=3600');
    
    return new NextResponse(buffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}