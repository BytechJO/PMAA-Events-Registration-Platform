"use client";

import { RotateCcw } from "lucide-react";
import { AdminBody, AdminTopBar } from "@/components/admin/AdminTopBar";
import { AdminErrorView } from "@/components/admin/states";
import { Button } from "@/components/ui/button";

/** Any admin page that fails: a safe message, the server log reference (digest) and Try again. */
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  const reference = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : undefined;
  return (
    <>
      <AdminTopBar crumbs={[{ label: "Error" }]} />
      <AdminBody>
        <AdminErrorView
          reference={reference}
          retry={
            <Button variant="outline" size="lg" onClick={() => retry()}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
          }
        />
      </AdminBody>
    </>
  );
}
