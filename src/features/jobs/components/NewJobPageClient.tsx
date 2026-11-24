"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FilePlus, Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { JobNumberSettingsDialog } from "./JobNumberSettingsDialog";

export function NewJobPageClient() {
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  return (
    <>
      <PageHeader
        icon={FilePlus}
        title="Create New Job"
        description="Book a new repair job for a customer."
        actions={
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSettingsDialogOpen(true)}
            title="Job Number Settings"
            className="hidden sm:flex"
          >
            <Settings className="h-4 w-4" />
          </Button>
        }
      />
      <JobNumberSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />
    </>
  );
}
