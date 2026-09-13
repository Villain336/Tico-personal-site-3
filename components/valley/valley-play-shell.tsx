"use client";

import { useEffect } from "react";
import { ValleyApp } from "./valley-app";

/** Marks the document so site chrome can collapse around a full-viewport valley. */
export function ValleyPlayShell() {
  useEffect(() => {
    document.documentElement.dataset.valleyPlay = "1";
    return () => {
      delete document.documentElement.dataset.valleyPlay;
    };
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-[#07060d]">
      <ValleyApp />
    </div>
  );
}
