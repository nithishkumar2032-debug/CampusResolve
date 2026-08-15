"use client";

import { useEffect, useState } from "react";
import { getEvidenceUrlAction } from "@/lib/actions";

export function EvidenceImage({
  storagePath,
  alt,
  className,
}: {
  storagePath: string;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getEvidenceUrlAction(storagePath);
      if (cancelled) return;
      if (res.error || !("url" in res) || !res.url) {
        setError(res.error ?? "Evidence unavailable");
        return;
      }
      setUrl(res.url);
    })();
    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  if (error) {
    return (
      <p className="rounded border border-outline-variant bg-muted p-3 text-xs text-on-surface-variant">
        {error}
      </p>
    );
  }
  if (!url) {
    return (
      <div className="flex h-40 items-center justify-center rounded border border-outline-variant bg-muted text-xs text-on-surface-variant">
        Loading evidence…
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className ?? "max-h-40 w-full rounded object-contain"} />;
}
