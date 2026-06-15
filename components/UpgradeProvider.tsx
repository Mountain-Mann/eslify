"use client";

import { createContext, useContext, useState } from "react";

interface UpgradeContextValue {
  open: boolean;
  showUpgrade: () => void;
  closeUpgrade: () => void;
}

const UpgradeContext = createContext<UpgradeContextValue>({
  open: false,
  showUpgrade: () => {},
  closeUpgrade: () => {},
});

export function UpgradeProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <UpgradeContext.Provider
      value={{
        open,
        showUpgrade: () => setOpen(true),
        closeUpgrade: () => setOpen(false),
      }}
    >
      {children}
    </UpgradeContext.Provider>
  );
}

export function useUpgrade() {
  return useContext(UpgradeContext);
}
