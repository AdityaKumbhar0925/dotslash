'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const username = formData.get('username');
  const password = formData.get('password');

  if (username === 'admin' && password === 'admin') {
    const cookieStore = await cookies();
    cookieStore.set('auth_token', 'validated-token-session', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      path: '/' 
    });
    redirect('/dashboard');
  } else {
    // If invalid, returning an error object
    return { error: 'Invalid credentials. Please use admin / admin.' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  redirect('/');
}
