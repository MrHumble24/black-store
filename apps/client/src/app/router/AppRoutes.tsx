import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/ui/ProtectedRoute";
import { DashboardLayout } from "@/widgets/layout/ui/DashboardLayout";
import LoginPage from "@/pages/login/ui/LoginPage";
import DashboardPage from "@/pages/dashboard/ui/DashboardPage";
import ProductsPage from "@/pages/products/ui/ProductsPage";
import CreateProductPage from "@/pages/products/ui/CreateProductPage";
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
        <Route path="/pos" element={<PlaceholderPage title="POS / Sell" />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/create" element={<CreateProductPage />} />
        <Route
          path="/inventory"
          element={<PlaceholderPage title="Inventory" />}
        />
        <Route path="/sales" element={<PlaceholderPage title="Sales" />} />
        <Route
          path="/purchases"
          element={<PlaceholderPage title="Purchases" />}
        />
        <Route path="/returns" element={<PlaceholderPage title="Returns" />} />
        <Route
          path="/expenses"
          element={<PlaceholderPage title="Expenses" />}
        />
        <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
        <Route
          path="/settings/users"
          element={<PlaceholderPage title="Users" />}
        />
        <Route
          path="/settings/warehouses"
          element={<PlaceholderPage title="Warehouses" />}
        />
        <Route
          path="/settings/brands"
          element={<PlaceholderPage title="Brands" />}
        />
        <Route
          path="/settings/categories"
          element={<PlaceholderPage title="Categories" />}
        />
        <Route
          path="/settings/providers"
          element={<PlaceholderPage title="Providers" />}
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
