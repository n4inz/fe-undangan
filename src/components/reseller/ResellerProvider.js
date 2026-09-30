'use client';

import { createContext, useContext } from 'react';

const ResellerContext = createContext(null);

export function ResellerProvider({ user, children }) {
  return <ResellerContext.Provider value={user}>{children}</ResellerContext.Provider>;
}

export function useResellerUser() {
  return useContext(ResellerContext);
}
