import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { toast } from "sonner";
import api from "@/shared/api/api";
import {
  ShieldCheck,
  CloudUpload,
  Download,
  FileArchive,
  RotateCcw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
}

export function BackupPage() {
  const [isTriggering, setIsTriggering] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const {
    data: backups,
    isLoading,
    refetch,
  } = useQuery<BackupFile[]>({
    queryKey: ["backups"],
    queryFn: async () => {
      const response = await api.get("/backup");
      return response.data;
    },
  });

  const handleBackup = async () => {
    setIsTriggering(true);
    try {
      await api.post("/backup/trigger");
      toast.success("Backup started successfully! Check Telegram.");
      // Ideally we would want to refetch after some time, but backup takes time.
      setTimeout(() => refetch(), 5000);
    } catch (error) {
      toast.error("Failed to trigger backup.");
      console.error(error);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Confirm action
    if (
      !window.confirm(
        "Are you sure you want to restore? This will OVERWRITE your current database with the backup data."
      )
    ) {
      return;
    }

    setIsRestoring(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Need valid Content-Type for file upload? Axios does it automatically with FormData usually.
      // But we need to make sure headers are set right.
      await api.post("/backup/restore", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(
        "Database successfully restored! You may need to refresh the page."
      );
    } catch (error) {
      toast.error("Failed to restore backup.");
      console.error(error);
    } finally {
      setIsRestoring(false);
      // Reset input
      event.target.value = "";
    }
  };

  const handleDownload = (filename: string) => {
    // We need to pass the auth token if the endpoint is protected (it is restricted to ADMIN)
    // However, for a simple file download link/window.open, passing headers is hard.
    // We can use a fetch/blob approach or rely on cookies if used.
    // Since we use Bearer token in headers, we must download via JS and create a blob URL.

    api
      .get(`/backup/${filename}`, {
        responseType: "blob",
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Download failed", error);
        toast.error("Failed to download backup file.");
      });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Manage system-level configurations and maintenance.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <CardTitle>System Backup</CardTitle>
            </div>
            <CardDescription>
              Manually trigger a system backup. This will create a database dump
              and an Excel export, zip them, save to server, and send to
              Telegram.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleBackup}
              disabled={isTriggering}
              className="gap-2"
            >
              <CloudUpload className="h-4 w-4" />
              {isTriggering ? "Backing up..." : "Trigger Backup Now"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900 bg-red-50/10 dark:bg-red-950/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-6 w-6 text-red-500" />
              <CardTitle>System Restore</CardTitle>
            </div>
            <CardDescription>
              Restore the database from a backup file.{" "}
              <span className="font-bold text-red-500">
                WARNING: This will overwrite the current database!
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant="destructive"
                onClick={() =>
                  document.getElementById("restore-input")?.click()
                }
                disabled={isRestoring}
                className="gap-2"
              >
                <CloudUpload className="h-4 w-4" />
                {isRestoring ? "Restoring..." : "Upload & Restore Backup"}
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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileArchive className="h-6 w-6 text-secondary-foreground" />
              <CardTitle>Backup History</CardTitle>
            </div>
            <CardDescription>
              Download previous system backups stored on the server.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading backups...</div>
            ) : !backups || backups.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No backups found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((file) => (
                    <TableRow key={file.filename}>
                      <TableCell className="font-medium">
                        {file.filename}
                      </TableCell>
                      <TableCell>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </TableCell>
                      <TableCell>
                        {new Date(file.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file.filename)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
