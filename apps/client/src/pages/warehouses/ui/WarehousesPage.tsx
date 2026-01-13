import { useState } from "react";
import { type Warehouse, warehouseQueries } from "@/entities/warehouse";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Search,
  Warehouse as WarehouseIcon,
  Store,
  Box,
  Loader2,
  X,
  MapPin,
} from "lucide-react";
import { Label } from "@/shared/ui/label";
import { Checkbox } from "@/shared/ui/checkbox";

export default function WarehousesPage() {
  const { data: warehouses, isLoading } = warehouseQueries.useAll();
  const createMutation = warehouseQueries.useCreate();
  const updateMutation = warehouseQueries.useUpdate();
  const deleteMutation = warehouseQueries.useDelete();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null
  );
  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(
    null
  );

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    isShop: false,
  });

  const filteredWarehouses = warehouses?.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.address?.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ name: "", address: "", isShop: false });
    setEditingWarehouse(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      address: warehouse.address || "",
      isShop: warehouse.isShop,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (editingWarehouse) {
      updateMutation.mutate(
        { id: editingWarehouse.id, data: formData },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            resetForm();
          },
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setIsDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleDelete = () => {
    if (!warehouseToDelete) return;
    deleteMutation.mutate(warehouseToDelete.id, {
      onSuccess: () => setWarehouseToDelete(null),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-muted-foreground">
            Manage your store locations and storage warehouses
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Warehouse
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <WarehouseIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Locations</p>
              <p className="text-2xl font-bold">{warehouses?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Store className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shops</p>
              <p className="text-2xl font-bold">
                {warehouses?.filter((w) => w.isShop).length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Box className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Storage Only</p>
              <p className="text-2xl font-bold">
                {warehouses?.filter((w) => !w.isShop).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/50">
                <TableHead className="w-[80px] font-semibold">ID</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">
                  Address
                </TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-border">
                    <TableCell colSpan={6}>
                      <div className="h-10 w-full rounded bg-muted"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredWarehouses?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-muted-foreground uppercase tracking-wider text-xs"
                  >
                    <WarehouseIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">No warehouses found</p>
                    <p className="text-muted-foreground normal-case mt-1">
                      {search
                        ? "Try adjusting your search"
                        : "Add your first warehouse location"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredWarehouses?.map((w) => (
                  <TableRow
                    key={w.id}
                    className="border-border hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{w.id}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{w.name}</div>
                      <div className="md:hidden text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {w.address || "No address"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {w.address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span>{w.address}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={w.isShop ? "default" : "outline"}
                        className="gap-1"
                      >
                        {w.isShop ? (
                          <>
                            <Store className="h-3 w-3" /> Shop
                          </>
                        ) : (
                          <>
                            <Box className="h-3 w-3" /> Storage
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={w.isActive ? "outline" : "secondary"}
                        className={
                          w.isActive
                            ? "border-green-500/50 text-green-600 bg-green-500/5"
                            : ""
                        }
                      >
                        {w.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => handleOpenEdit(w)}
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                            onClick={() => setWarehouseToDelete(w)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}
            </DialogTitle>
            <DialogDescription>
              {editingWarehouse
                ? "Update warehouse information"
                : "Register a new shop or storage location"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name</Label>
              <Input
                id="name"
                placeholder="e.g. Main Shop, Secondary Warehouse"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Street address, city"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isShop"
                checked={formData.isShop}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isShop: !!checked })
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="isShop" className="text-sm font-medium">
                  Is a Shop location
                </Label>
                <p className="text-xs text-muted-foreground">
                  Tick this if sales will be conducted directly from this
                  location.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.name.trim() ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingWarehouse ? "Save Changes" : "Create Warehouse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!warehouseToDelete}
        onOpenChange={(open) => !open && setWarehouseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                "{warehouseToDelete?.name}"
              </span>
              ? This action cannot be undone. Any inventory at this location
              should be moved first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
