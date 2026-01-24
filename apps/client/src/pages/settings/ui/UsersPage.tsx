import { useState } from "react";
import { useTranslation } from "react-i18next";
import { userQueries, type User } from "@/entities/user";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Badge } from "@/shared/ui/badge";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  User as UserIcon,
  Shield,
  Loader2,
} from "lucide-react";

export default function UsersPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<User["role"]>("SALESPERSON");

  const { data: users, isLoading } = userQueries.useAll();
  const createUserMutation = userQueries.useCreate();
  const updateUserMutation = userQueries.useUpdate();
  const deleteUserMutation = userQueries.useDelete();

  const filteredUsers = users?.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setPassword(""); // Don't show existing password
    } else {
      setEditingUser(null);
      setName("");
      setEmail("");
      setRole("SALESPERSON");
      setPassword("");
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingUser) {
      updateUserMutation.mutate(
        {
          id: editingUser.id,
          data: { name, email, role, ...(password ? { password } : {}) },
        },
        { onSuccess: () => setIsDialogOpen(false) },
      );
    } else {
      createUserMutation.mutate(
        { name, email, password, role },
        { onSuccess: () => setIsDialogOpen(false) },
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm(t("settings.users.delete_confirm"))) {
      deleteUserMutation.mutate(id);
    }
  };

  const getRoleBadge = (role: User["role"]) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge className="bg-red-600/10 text-red-500 border-red-500/20 text-[10px] font-black tracking-widest uppercase">
            {t("settings.users.roles.admin")}
          </Badge>
        );
      case "MANAGER":
        return (
          <Badge className="bg-blue-600/10 text-blue-500 border-blue-500/20 text-[10px] font-black tracking-widest uppercase">
            {t("settings.users.roles.manager")}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-emerald-600/10 text-emerald-500 border-emerald-500/20 text-[10px] font-black tracking-widest uppercase">
            {t("settings.users.roles.sales")}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            {t("settings.users.title")}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {t("settings.users.description")}
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-900/20 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2 stroke-3" />
          {t("settings.users.add_new")}
        </Button>
      </div>

      <Card className="bg-card border-border shadow-2xl overflow-hidden">
        <CardHeader className="p-6 border-b border-border bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("settings.users.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 bg-muted border-border text-sm font-medium"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 py-4">
                  {t("settings.users.table.account")}
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 py-4 text-center">
                  {t("settings.users.table.access")}
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6 py-4 text-right">
                  {t("settings.users.table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-border hover:bg-muted/30 transition-colors group"
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-[10px] font-black text-blue-500 border border-blue-500/10 uppercase group-hover:scale-110 transition-transform">
                        {user.name.charAt(0)}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-black text-foreground leading-none">
                          {user.name}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-muted-foreground hover:text-foreground"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleOpenDialog(user)}
                          className="font-bold gap-2 focus:bg-blue-600/10 focus:text-blue-500"
                        >
                          <Edit className="w-4 h-4" />
                          {t("settings.users.actions.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(user.id)}
                          className="font-bold gap-2 text-red-500 focus:bg-red-600/10 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t("settings.users.actions.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic uppercase tracking-tight flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-500" />
              {editingUser
                ? t("settings.users.dialog.title_edit")
                : t("settings.users.dialog.title_new")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                {t("settings.users.dialog.name_label")}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("settings.users.dialog.name_placeholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-10 bg-muted border-border font-bold text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                {t("settings.users.dialog.email_label")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={t("settings.users.dialog.email_placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-10 bg-muted border-border font-bold text-sm text-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                {t("settings.users.dialog.password_label")}
              </label>
              <Input
                type="password"
                placeholder={
                  editingUser
                    ? t("settings.users.dialog.password_placeholder_edit")
                    : t("settings.users.dialog.password_placeholder_new")
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 bg-muted border-border font-bold text-sm px-4"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                {t("settings.users.dialog.role_label")}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["ADMIN", "MANAGER", "SALESPERSON"] as const).map((r) => (
                  <Button
                    key={r}
                    variant={role === r ? "default" : "outline"}
                    onClick={() => setRole(r)}
                    className={`h-12 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      role === r
                        ? "bg-blue-600 shadow-lg shadow-blue-900/20"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {r === "ADMIN" && <Shield className="w-3 h-3 mr-1.5" />}
                    {r === "ADMIN"
                      ? t("settings.users.roles.admin")
                      : r === "MANAGER"
                        ? t("settings.users.roles.manager")
                        : t("settings.users.roles.sales")}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-border font-bold text-sm"
            >
              {t("settings.users.dialog.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                createUserMutation.isPending || updateUserMutation.isPending
              }
              className="bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-900/20 px-8 rounded-xl"
            >
              {(createUserMutation.isPending ||
                updateUserMutation.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {editingUser
                ? t("settings.users.dialog.submit_edit")
                : t("settings.users.dialog.submit_new")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
