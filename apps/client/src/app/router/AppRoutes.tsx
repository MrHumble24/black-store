import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/ui/ProtectedRoute";
import { DashboardLayout } from "@/widgets/layout/ui/DashboardLayout";
import LoginPage from "@/pages/login/ui/LoginPage";
import DashboardPage from "@/pages/dashboard/ui/DashboardPage";
import ProductsPage from "@/pages/products/ui/ProductsPage";
import CreateProductPage from "@/pages/products/ui/CreateProductPage";
import EditProductPage from "@/pages/products/ui/EditProductPage";
import BrandsPage from "@/pages/brands/ui/BrandsPage";
import CategoriesPage from "@/pages/categories/ui/CategoriesPage";
import WarehousesPage from "@/pages/warehouses/ui/WarehousesPage";
import ProvidersPage from "@/pages/providers/ui/ProvidersPage";
import InventoryPage from "@/pages/inventory/ui/InventoryPage";
import CreateInventoryPage from "@/pages/inventory/ui/CreateInventoryPage";
import InventoryItemDetailsPage from "@/pages/inventory/ui/InventoryItemDetailsPage";
import TransferInventoryPage from "@/pages/inventory/ui/TransferInventoryPage";
import PosPage from "@/pages/pos/ui/PosPage";
import SalesPage from "@/pages/sales/ui/SalesPage";
import SaleDetailsPage from "@/pages/sales/ui/SaleDetailsPage";
import PurchasesPage from "@/pages/purchases/ui/PurchasesPage";
import CreatePurchasePage from "@/pages/purchases/ui/CreatePurchasePage";
import PurchaseDetailsPage from "@/pages/purchases/ui/PurchaseDetailsPage";
import ReturnsPage from "@/pages/returns/ui/ReturnsPage";
import ReturnDetailsPage from "@/pages/returns/ui/ReturnDetailsPage";
import ExpensesPage from "@/pages/expenses/ui/ExpensesPage";
import ReportsPage from "@/pages/reports/ui/ReportsPage";
import NotFoundPage from "@/pages/not-found/ui/NotFoundPage";

// Placeholder pages (to be implemented)
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground">This page is under construction.</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes with layout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/pos" element={<PosPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/create" element={<CreateProductPage />} />
        <Route path="/products/:id/edit" element={<EditProductPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/create" element={<CreateInventoryPage />} />
        <Route path="/inventory/transfer" element={<TransferInventoryPage />} />
        <Route path="/inventory/:id" element={<InventoryItemDetailsPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/sales/:id" element={<SaleDetailsPage />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/purchases/create" element={<CreatePurchasePage />} />
        <Route path="/purchases/:id" element={<PurchaseDetailsPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/returns/:id" element={<ReturnDetailsPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route
          path="/settings/users"
          element={<PlaceholderPage title="Users" />}
        />
        <Route path="/settings/warehouses" element={<WarehousesPage />} />
        <Route path="/settings/brands" element={<BrandsPage />} />
        <Route path="/settings/categories" element={<CategoriesPage />} />
        <Route path="/settings/providers" element={<ProvidersPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
