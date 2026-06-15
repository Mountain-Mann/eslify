"use client";

import { useEffect, useState } from "react";

export function useRotatingMessage(messages: string[], interval = 1800) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, interval);
    return () => clearInterval(id);
  }, [messages, interval]);

  return messages[index];
}
