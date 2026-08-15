"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const ev = e as Event & { prompt: () => Promise<void> };
      setInstallEvent({ prompt: () => ev.prompt() });
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    void navigator.serviceWorker.register("/sw.js").then((reg) => {
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      });
    });

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 bottom-20 z-40 flex flex-col gap-2 sm:bottom-6">
      {installEvent ? (
        <Button
          type="button"
          className="pointer-events-auto rounded-lg bg-navy shadow-lg hover:bg-navy-deep"
          onClick={() => void installEvent.prompt()}
        >
          Install CampusResolve
        </Button>
      ) : null}
      {updateReady ? (
        <Button
          type="button"
          variant="outline"
          className="pointer-events-auto rounded-lg bg-white shadow-lg"
          onClick={() => window.location.reload()}
        >
          Update available — reload
        </Button>
      ) : null}
    </div>
  );
}
