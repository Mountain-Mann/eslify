"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { UserState } from "@/lib/types";

interface UserContextValue {
  user: UserState | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: UserState | null) => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  setUser: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
