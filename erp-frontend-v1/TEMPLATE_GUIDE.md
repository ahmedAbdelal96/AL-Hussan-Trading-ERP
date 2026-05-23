# 📖 Dashboard Template - Usage Guide

## 🎯 Quick Start Checklist

When starting a new project with this template, follow this checklist:

### ✅ Initial Setup

1. **Clone/Copy Template**

   ```bash
   # Copy this folder to your new project location
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment**

   ```bash
   cp .env.example .env
   # Edit .env with your API URL and settings
   ```

4. **Update Project Info**

   - [ ] Edit `package.json` (name, description, version)
   - [ ] Update `VITE_APP_NAME` in `.env`
   - [ ] Update README.md with your project details

5. **Run Development Server**
   ```bash
   npm run dev
   ```

---

## 🏗️ Adding New Features

### 1. Create New Page

```typescript
// src/pages/products/ProductsPage.tsx
export default function ProductsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Products</h1>
      {/* Your content */}
    </div>
  );
}
```

### 2. Create API Service

```typescript
// src/services/api/products.api.ts
import { apiClient } from "./axiosConfig";

export const productsApi = {
  getAll: async () => {
    const response = await apiClient.get("/products");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: CreateProductDto) => {
    const response = await apiClient.post("/products", data);
    return response.data;
  },
};

// Export types
export type { CreateProductDto, Product } from "./types";
```

### 3. Add Routes

```typescript
// src/routes/products.routes.tsx
import { lazy } from "react";
const ProductsPage = lazy(() => import("@/pages/products/ProductsPage"));

export const productsRoutes = [
  {
    path: "/products",
    element: <ProductsPage />,
  },
];

// src/routes/index.tsx - Add to children
import { productsRoutes } from "./products.routes";

children: [
  // ... existing routes
  ...productsRoutes,
];
```

### 4. Add to Sidebar

```typescript
// src/components/layout/AppSidebar.tsx
const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    nameKey: "dashboard",
    subItems: [{ name: "Home", nameKey: "homePage", path: "/" }],
  },

  // Add your new module
  {
    icon: <PageIcon />,
    name: "Products",
    nameKey: "products",
    subItems: [
      { name: "All Products", nameKey: "allProducts", path: "/products" },
      { name: "Add Product", nameKey: "addProduct", path: "/products/add" },
    ],
  },
];
```

### 5. Add Translations

```typescript
// src/i18n/locales/ar/sidebar.ts
export const sidebar = {
  // ... existing
  products: "المنتجات",
  allProducts: "كل المنتجات",
  addProduct: "إضافة منتج",
};

// src/i18n/locales/en/sidebar.ts
export const sidebar = {
  // ... existing
  products: "Products",
  allProducts: "All Products",
  addProduct: "Add Product",
};
```

---

## 🔐 Enabling Permissions System

If you need role-based access control:

### 1. Uncomment Permission Code in Sidebar

```typescript
// src/components/layout/AppSidebar.tsx

// Uncomment this import
import { useAuthPermissions } from "@/hooks/auth/useAuthPermissions";

// Uncomment this hook
const { canAny } = useAuthPermissions();

// Uncomment permission types
type NavItem = {
  permission?: string | string[];
  // ...
};

// Uncomment permission checks in the code
```

### 2. Create useAuthPermissions Hook

```typescript
// src/hooks/useAuthPermissions.ts
export const useAuthPermissions = () => {
  const { user } = useAuth();

  const canAny = (permissions: string[]) => {
    // Your permission logic
    return user?.permissions?.some((p) => permissions.includes(p));
  };

  return { canAny };
};
```

### 3. Add Permissions to Menu Items

```typescript
{
  name: "Products",
  nameKey: "products",
  permission: ["products:read", "products:write"],
  subItems: [
    {
      name: "Add Product",
      path: "/products/add",
      permission: "products:create"
    },
  ],
}
```

---

## 🎨 Customization

### Change Brand Colors

Edit `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      brand: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        // ... your colors
        950: '#082f49',
      },
    },
  },
},
```

### Change Logo

Replace files in:

- `public/logo/logo-white.png` (for sidebar)
- `public/logo/logo.png` (for light backgrounds)

### Update Meta Tags

Edit `index.html`:

```html
<title>Your App Name</title>
<meta name="description" content="Your app description" />
```

---

## 📦 Project Structure Best Practices

### Folder Organization

```
src/
├── pages/              # One folder per feature
│   ├── products/
│   │   ├── ProductsListPage.tsx
│   │   ├── ProductFormPage.tsx
│   │   └── ProductDetailPage.tsx
│   └── dashboard/
│       └── DashboardPage.tsx
│
├── components/
│   ├── products/       # Feature-specific components
│   │   ├── ProductCard.tsx
│   │   └── ProductForm.tsx
│   ├── common/         # Shared components
│   └── ui/             # Shadcn UI components
│
├── services/api/       # API services
│   ├── products.api.ts
│   └── auth.api.ts
│
├── types/              # TypeScript types
│   ├── product.types.ts
│   └── user.types.ts
│
└── hooks/              # Custom hooks
    ├── useProducts.ts
    └── useDebounce.ts
```

### Naming Conventions

- **Components**: PascalCase (`ProductCard.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useProducts.ts`)
- **API Services**: camelCase with '.api' suffix (`products.api.ts`)
- **Types**: camelCase with '.types' suffix (`product.types.ts`)

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Deploy to Vercel/Netlify

1. Connect your Git repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables

---

## 🐛 Troubleshooting

### Common Issues

**1. API Connection Failed**

- Check `.env` file has correct `VITE_API_BASE_URL`
- Ensure backend is running
- Check CORS settings on backend

**2. Build Errors**

- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

**3. TypeScript Errors**

- Run type check: `npm run type-check`
- Update types in `src/types/`

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query/latest)

---

## 🤝 Support

For questions or issues:

1. Check existing documentation
2. Review example code in template
3. Create an issue in your project repository

---

**Happy Coding! 🎉**
