# Black Store — Project Report

---

## 1. Project Idea

**Black Store** is a retail store management system (ERP-lite) designed for electronics and tech products. The system covers the full business lifecycle from catalog management through multi-warehouse inventory, inbound purchases, point-of-sale (POS) sales, returns, expenses, reporting, and disaster recovery.

### Target Users & Use Cases

- **Retail store owners** managing electronics inventory (phones, laptops, tablets) with serial-number tracking (IMEI) and batch items
- **Managers** overseeing sales performance, profit margins, and low-stock alerts
- **Sales staff** using POS for fast checkout, barcode scanning, and customer data capture
- **Administrators** handling returns, expense tracking, user management, and backup/restore

### Key Features

- **Serialized vs batch products**: Phones/laptops tracked by IMEI (one unit per record); accessories/parts tracked by quantity with FIFO allocation
- **Multi-warehouse**: Stock locations can be shops or storage; inter-warehouse transfers supported
- **Purchases from providers or walking customers**: Different purchase types (provider purchase vs walk-in seller)
- **POS**: Quick add-to-cart, variant selection, serial picker for serialized items, barcode scan, payment methods, discount/tax, receipt printing
- **Returns workflow**: PENDING → APPROVED / RESTOCKED / REJECTED / DISPOSED, with inventory restoration on restock
- **Reports**: Sales by period, profit & loss, inventory value by warehouse/category, dashboard KPIs
- **AI integration**: Product descriptions, variant suggestions, dashboard insights (Ollama, Gemini, OpenAI)
- **Backup & restore**: Daily cron backup (PostgreSQL dump + Excel export), zip archive, Telegram delivery; emergency restore from uploaded zip

---

## 2. Business Logic Structure

### 2.1 Domain Overview

| Domain | Purpose |
|--------|---------|
| **Catalog** | Products, variants (SKU, specs), brands, categories |
| **Inventory** | Stock items per warehouse; status: AVAILABLE, RESERVED, SOLD, DEFECTIVE, LOST |
| **Purchases** | Inbound stock (provider or walking customer); creates `InventoryItem` + `StockMovement` |
| **Sales** | Outbound via POS; serialized items require `inventoryItemId`, batch uses FIFO allocation |
| **Returns** | Pending → Approved / Restocked / Rejected / Disposed; restock restores inventory + `StockMovement` |
| **Expenses** | Rent, utilities, salary, transport, repairs, marketing, supplies, other |
| **Reports** | Sales summary, profit, inventory value, dashboard KPIs |
| **AI** | Product description, variant generation, dashboard analysis |
| **Backup** | Scheduled backup, manual trigger, restore from zip |

### 2.2 Product Types

**SERIALIZED**

- One physical unit = one `InventoryItem`
- Tracked by `serialNumber` (e.g. IMEI)
- At sale: user must select specific `inventoryItemId` from available stock
- At return: original `inventoryItem` restored to AVAILABLE
- Used for phones, laptops, tablets

**BATCH**

- One `InventoryItem` can hold `quantity` > 1
- Allocation: FIFO (first available record with enough quantity)
- Partial sales supported (decrement quantity or split record)
- Used for accessories, cables, cases

### 2.3 Inventory Status Lifecycle

```
AVAILABLE → (sale) → SOLD
AVAILABLE → (reserve) → RESERVED
AVAILABLE / SOLD → (mark defective) → DEFECTIVE
AVAILABLE / SOLD → (mark lost) → LOST
SOLD → (return restocked) → AVAILABLE
```

### 2.4 Stock Movements (Audit Trail)

Every stock change creates a `StockMovement` record:

- **INBOUND_PURCHASE**: New stock from purchase
- **OUTBOUND_SALE**: Stock sold
- **TRANSFER**: Between warehouses
- **ADJUSTMENT**: Manual corrections (e.g. approved return with no restock)
- **RETURN_RESTOCK**: Returned item put back to inventory

### 2.5 Purchase Flow

1. Create `Purchase` (type: PROVIDER | WALKING_CUSTOMER, providerId, userId, totalCost)
2. For each line item:
   - Look up `ProductVariant` + `Product`
   - **SERIALIZED**: require `serialNumber`; create one `InventoryItem` per unit (quantity=1)
   - **BATCH**: create `InventoryItem` with quantity, `batchNumber` optional
3. Create `StockMovement` (type: INBOUND_PURCHASE, toWarehouseId)
4. All in a single Prisma transaction

### 2.6 Sale Flow

1. Create `Sale` (invoiceNo, userId, customerName, paymentMethod, totalAmount, discountAmount, taxAmount)
2. For each line item:
   - **SERIALIZED**: require `inventoryItemId`; update item status to SOLD, link `soldAtItemId` to `OrderItem`
   - **BATCH**: find first available `InventoryItem` with sufficient quantity; decrement or mark SOLD
3. Store `costPrice` on `OrderItem` for profit calculation
4. Create `StockMovement` (type: OUTBOUND_SALE)
5. All in a single transaction

**Void sale** reverses the above: restore inventory, create RETURN_RESTOCK movement, delete sale.

### 2.7 Return Flow

1. Create `Return` linked to `saleId`, `orderItemId`, reason, refundAmount, status=PENDING
2. **Process** (PATCH `/returns/:id/process`):
   - **RESTOCKED**: Restore `InventoryItem` (serialized: flip status; batch: increment or create new); create RETURN_RESTOCK movement
   - **APPROVED**: Refund only, no restock; create ADJUSTMENT with quantity=0
   - **DISPOSED**: Item discarded; create ADJUSTMENT with quantity=0
   - **REJECTED**: No inventory/financial change

### 2.8 Financial Flow

- **Revenue**: Sum of `Sale.totalAmount` minus refunds from processed returns
- **COGS**: Sum of `OrderItem.costPrice` for sold items minus cost recovered from RESTOCKED returns
- **Profit**: `grossProfit = revenue - cogs`; `netProfit = grossProfit - expenses`
- **Reports** compute: gross margin, net margin, top products by revenue, top sellers, sales by day

---

## 3. Data Model (Schema Overview)

### Core Entities

- **User**: email, password, name, role (ADMIN | MANAGER | SALESPERSON), isActive
- **Warehouse**: name, address, isShop, isActive
- **Brand** / **Category**: name, isActive
- **Product**: name, description, type (SERIALIZED | BATCH), minStock, brandId, categoryId
- **ProductVariant**: productId, sku, modelCode, name, specs (JSON), isActive
- **InventoryItem**: variantId, warehouseId, serialNumber?, batchNumber?, quantity, costPrice, status, purchaseId, soldAtItemId?
- **Purchase**: type, providerId?, userId, totalCost, sellerInfo
- **Sale**: invoiceNo, userId, customerName?, customerPhone?, paymentMethod, totalAmount, discountAmount, taxAmount
- **OrderItem**: saleId, variantId, quantity, sellPrice, costPrice, warrantyEnd?, inventoryItem?
- **Return**: saleId, orderItemId, reason, status, refundAmount, processedById?, createdById
- **StockMovement**: type, productId, quantity, fromWarehouseId?, toWarehouseId?, userId, notes
- **Expense**: category, amount, description, receiptNo, expenseDate, createdById
- **Provider**: name, contact, isActive

### Enums

- Role, ProductType, ItemStatus, MovementType, ReturnReason, ReturnStatus, ExpenseCategory, PurchaseType, PaymentMethod

---

## 4. Architecture & Patterns

### 4.1 Tech Stack

| Layer | Technology |
|-------|------------|
| API | NestJS, Prisma, PostgreSQL |
| Auth | JWT (Bearer token), role-based access |
| Client | React 19, Vite, React Query (TanStack Query), React Router |
| UI | shadcn/ui (Tailwind) |
| i18n | react-i18next (en, ru, uz) |
| Monorepo | pnpm workspaces |

### 4.2 API Structure

**Module-per-domain**

- Auth, Users, Warehouses, Brands, Categories, Products, Providers
- Purchases, Sales, Inventory, StockMovements, Returns, Expenses
- Reports, Lookup, Warranty, AI, Backup

**Guards**

- `AuthGuard`: JWT validation; exempts public routes (e.g. login, emergency-restore)
- `RolesGuard`: Enforces role requirements on specific endpoints

**Controllers (REST)**

| Controller | Main Endpoints |
|------------|----------------|
| auth | POST /login, GET /profile |
| users | CRUD + list |
| warehouses | CRUD + list |
| brands / categories | CRUD + list |
| products | CRUD, search, low-stock, variants (CRUD, sku lookup), bulk |
| providers | CRUD + list |
| purchases | POST, GET, GET :id |
| sales | POST, GET, GET :id, POST :id/void |
| inventory | CRUD, GET by warehouse/variant, POST transfer |
| stock-movements | GET list, GET :id |
| returns | POST, GET, GET :id, PATCH :id/process |
| expenses | CRUD, GET summary |
| reports | GET dashboard, sales, inventory-value, profit |
| lookup | GET (combined), GET variant/:id, GET variant/:id/serials |
| warranty | GET generate/:orderItemId, sale/:saleId, verify/:code |
| ai | POST generate, product-description, product-variants, analyze-dashboard |
| backup | POST trigger, POST restore, GET list, GET :filename |

### 4.3 Frontend Structure (FSD-style)

```
app/           Router (AppRoutes), Providers, bootstrap
shared/        UI components (button, card, table, etc.), API client (axios), i18n, utils
entities/      Domain models + API hooks (product, sale, purchase, inventory, user, warehouse, etc.)
features/      auth (ProtectedRoute), product-filters, export-products, language-switcher
widgets/       layout (Sidebar, DashboardLayout, TabBar), product-table
pages/         Route-level screens (Dashboard, POS, Products, Sales, Purchases, Returns, Expenses, Reports, etc.)
```

**Data flow**

- React Query (`useQuery`, `useMutation`) for server state
- Axios instance with Bearer token; 401 triggers logout + redirect to `/login`
- Local stores (e.g. `auth.store`, `pos-store`, `tabs.store`, `purchase-store`) for UI state

### 4.4 Key Patterns

- **Transactional consistency**: Purchase creation, sale creation, return processing, inventory transfer all use `prisma.$transaction`
- **Stock allocation**: SERIALIZED by explicit `inventoryItemId`; BATCH by `findFirst` on available stock (FIFO)
- **Audit trail**: `StockMovement` for all physical stock changes; `User` relations on sales, purchases, returns
- **Reports**: Raw SQL for complex aggregates (sales by day, top products); Prisma aggregates for totals
- **BigInt serialization**: Custom `toJSON` on `BigInt.prototype` for Prisma aggregation results

---

## 5. AI Module

**Providers**: Ollama (default), Gemini, OpenAI (configurable via env)

**Endpoints**

- `POST /ai/generate` — Raw prompt generation
- `POST /ai/product-description` — Product description by name + category
- `POST /ai/product-variants` — JSON array of variant suggestions (name + specs)
- `POST /ai/analyze-dashboard` — Dashboard data analysis (revenue, orders, low stock, pending returns, recent sales → bullet insights)

Used in client for: product creation (description, variants), dashboard AI insights card.

---

## 6. Backup & Restore

**Scheduled backup** (cron daily at midnight)

1. Create DB dump (pg_dump)
2. Export all Prisma models to Excel (XLSX)
3. Zip both files
4. Send zip to Telegram (env: TELEGRAM_CHAT_ID, TELEGRAM_BOT_TOKEN)

**Manual**

- `POST /backup/trigger` — Run backup on demand
- `POST /backup/restore` — Upload zip; extract, find .sql, drop schema, restore via psql

**Emergency restore page** (`/emergency-restore`) — Public route for recovery when auth may be broken.

---

## 7. Internationalization

- Locales: English, Russian, Uzbek
- Keys for: navigation, forms, tables, POS, reports, validation
- `LanguageSwitcher` in layout for runtime switch

---

## 8. Summary

Black Store is a production-oriented retail management system for electronics. The backend uses NestJS modules with Prisma and PostgreSQL, strict transactions for inventory and financial flows, and a full audit trail via stock movements. The frontend follows an FSD-like structure (entities/features/widgets/pages) with React Query for data and shadcn/ui for components. It supports serialized and batch products, multi-warehouse operations, POS, returns, expenses, reports, AI assistance, and automated backup with Telegram delivery.
