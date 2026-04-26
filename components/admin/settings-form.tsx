"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserSettings } from "@/lib/actions/settings";
import type { UserSettings } from "@/lib/types/assessments";

export function SettingsForm({ settings }: { settings: UserSettings }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setSaved(false);
    try {
      await updateUserSettings(formData);
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-md">
      <div className="space-y-2">
        <Label>Assessment Rhythm</Label>
        <Select name="rhythm" defaultValue={settings.rhythm}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="adhoc">Ad-hoc</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Controls the period selector when creating assessments and the
          auto-creation schedule.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Notification Email</Label>
        <Input
          name="notification_email"
          type="email"
          defaultValue={settings.notification_email ?? ""}
          placeholder="you@example.com"
        />
        <p className="text-sm text-muted-foreground">
          Receive an email when draft assessments are auto-created.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </Button>
        {saved && (
          <span className="text-sm text-muted-foreground">Saved</span>
        )}
      </div>
    </form>
  );
}
