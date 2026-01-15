import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { toast } from "sonner";
import api from "@/shared/api/api";
import { RotateCcw, ShieldAlert } from "lucide-react";

export function EmergencyRestorePage() {
  const [key, setKey] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!key) {
      toast.error("Please enter the restoration key first.");
      event.target.value = "";
      return;
    }

    if (
      !window.confirm(
        "CRITICAL WARNING: This will OVERWRITE your entire database. All current data will be lost. Are you absolutely sure?"
      )
    ) {
      event.target.value = "";
      return;
    }

    setIsRestoring(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/backup/restore", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-backup-restore-key": key,
        },
      });
      toast.success(
        "System successfully restored! You can now log in with credentials from the backup."
      );
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 403) {
        toast.error("Invalid restore key. Access denied.");
      } else {
        toast.error("Failed to restore system.");
      }
    } finally {
      setIsRestoring(false);
      event.target.value = "";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-red-500 bg-red-50/10 dark:bg-red-950/10">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-500">
            <ShieldAlert className="h-8 w-8" />
            <CardTitle className="text-2xl">Emergency System Restore</CardTitle>
          </div>
          <CardDescription>
            Use this page to restore the system database from a backup file if
            you cannot log in.
            <br />
            <span className="font-bold text-red-500 mt-2 block">
              WARNING: This is a destructive action.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="restore-key" className="text-sm font-medium">
              Restoration Key
            </label>
            <Input
              id="restore-key"
              type="password"
              placeholder="Enter secure restore key..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => document.getElementById("restore-input")?.click()}
              disabled={isRestoring || !key}
            >
              {isRestoring ? (
                "Restoring System..."
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Upload Backup & Restore
                </>
              )}
            </Button>
            <input
              id="restore-input"
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleRestore}
              disabled={isRestoring}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
