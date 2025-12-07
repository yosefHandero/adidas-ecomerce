import { NextRequest, NextResponse } from 'next/server';
import { getPocketBase } from '@/lib/pocketbase';
import { setAuthCookie, clearAuthCookie } from '@/lib/auth/server';

/**
 * PocketBase auth API route handler
 * Handles login, signup, logout, and auth refresh
 */
export async function POST(request: NextRequest) {
  try {
    const pb = getPocketBase();
    const body = await request.json();
    const { action, email, password, passwordConfirm, name } = body;

    switch (action) {
      case 'signup': {
        if (!email || !password || !passwordConfirm) {
          return NextResponse.json(
            { error: 'Email, password, and passwordConfirm are required' },
            { status: 400 }
          );
        }

        const data: any = { email, password, passwordConfirm };
        if (name) data.name = name;

        const record = await pb.collection('users').create(data);
        const authData = await pb.collection('users').authWithPassword(email, password);
        
        await setAuthCookie(authData.token, authData.record);
        
        return NextResponse.json({ user: authData.record });
      }

      case 'login': {
        if (!email || !password) {
          return NextResponse.json(
            { error: 'Email and password are required' },
            { status: 400 }
          );
        }

        const authData = await pb.collection('users').authWithPassword(email, password);
        await setAuthCookie(authData.token, authData.record);
        
        return NextResponse.json({ user: authData.record });
      }

      case 'logout': {
        pb.authStore.clear();
        await clearAuthCookie();
        return NextResponse.json({ success: true });
      }

      case 'refresh': {
        const cookieStore = request.cookies;
        const authCookie = cookieStore.get('pb_auth');
        
        if (authCookie?.value) {
          pb.authStore.loadFromCookie(authCookie.value);
          if (pb.authStore.isValid) {
            await pb.collection('users').authRefresh();
            await setAuthCookie(pb.authStore.token!, pb.authStore.model!);
            return NextResponse.json({ user: pb.authStore.model });
          }
        }
        
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: error.status || 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const pb = getPocketBase();
    const cookieStore = request.cookies;
    const authCookie = cookieStore.get('pb_auth');

    if (authCookie?.value) {
      pb.authStore.loadFromCookie(authCookie.value);
      if (pb.authStore.isValid) {
        return NextResponse.json({ user: pb.authStore.model });
      }
    }

    return NextResponse.json({ user: null });
  } catch (error: any) {
    return NextResponse.json({ user: null });
  }
}
