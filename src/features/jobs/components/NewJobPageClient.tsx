"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { JobNumberSettingsDialog } from "./JobNumberSettingsDialog";

export function NewJobPageClient() {
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Create New Job</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSettingsDialogOpen(true)}
          title="Job Number Settings"
          className="hidden sm:flex"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      <JobNumberSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />
    </>
  );
}
