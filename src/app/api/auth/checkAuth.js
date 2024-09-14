'use server'

import axios from 'axios';

export async function checkAuthClient(req) {
  try {
    const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + "/cek-role", {
        withCredentials: true,
    });

    if (response.status === 200 && response.data.isAdmin) {
      return { authenticated: true, user: response.data.isAdmin };
    } else {
      return { authenticated: false };
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    return { authenticated: false };
  }
}