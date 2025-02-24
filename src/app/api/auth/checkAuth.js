'use server'

import { cookies } from 'next/headers';

export async function checkAuthClient(req) {
  const cookieStore = cookies()
  const token = cookieStore.get('client_token')
    if (token) {
      console.log('Authentication successful');
      return { authenticated: true};
    } else {
      console.log('Authentication fail');
      return { authenticated: false };
    }

}