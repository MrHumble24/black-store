import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [key, setKey] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!key) {
      toast.error(t("settings.emergency.error_key_missing"));
      event.target.value = "";
      return;
    }

    if (!window.confirm(t("settings.emergency.confirm_critical"))) {
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
      toast.success(t("settings.emergency.success"));
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 403) {
        toast.error(t("settings.emergency.error_invalid_key"));
      } else {
        toast.error(t("settings.emergency.error_generic"));
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
            <CardTitle className="text-2xl">
              {t("settings.emergency.title")}
            </CardTitle>
          </div>
          <CardDescription>
            {t("settings.emergency.description")}
            <br />
            <span className="font-bold text-red-500 mt-2 block">
              {t("settings.emergency.warning")}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="restore-key" className="text-sm font-medium">
              {t("settings.emergency.key_label")}
            </label>
            <Input
              id="restore-key"
              type="password"
              placeholder={t("settings.emergency.key_placeholder")}
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
                t("settings.emergency.restoring")
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  {t("settings.emergency.restore_btn")}
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
