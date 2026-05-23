




# 🚀 React + TypeScript Dashboard Template

A clean, reusable dashboard template built with modern technologies and best practices. Perfect starting point for any new project.

## ✨ Features

- ✅ **Clean Architecture** - Well-organized folder structure
- ✅ **Authentication System** - Ready-to-use login/logout
- ✅ **Responsive Sidebar** - Collapsible with mobile support
- ✅ **Multi-language** - i18n support (Arabic/English)
- ✅ **Dark/Light Theme** - Theme switching
- ✅ **TypeScript** - Full type safety
- ✅ **Shadcn UI** - Beautiful UI components
- ✅ **React Query** - Server state management
- ✅ **Zustand** - Client state management

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update API URL in .env
VITE_API_BASE_URL=http://localhost:3000/api/v1

# Run development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/          # Sidebar, Header, AppLayout
│   ├── common/          # Reusable components
│   └── ui/              # Shadcn UI components
├── pages/
│   ├── dashboard/       # Dashboard page
│   └── AuthPages/       # Login page
├── context/             # React Contexts (Auth, Language, Theme)
├── hooks/               # Custom hooks
├── services/
│   ├── api/            # API services
│   └── utils/          # API utilities
├── i18n/               # Translations (AR/EN)
├── store/              # Zustand stores
├── routes/             # React Router config
└── types/              # TypeScript types
```

## 🎯 How to Use This Template

### 1. **Add New Module**

Create your module structure:

```
src/pages/products/
  ├── ProductsListPage.tsx
  └── ProductFormPage.tsx
```

### 2. **Add API Service**

```typescript
// src/services/api/products.api.ts
export const productsApi = {
  getAll: () => apiClient.get("/products"),
  create: (data) => apiClient.post("/products", data),
  // ...
};
```

### 3. **Add Routes**

```typescript
// src/routes/products.routes.tsx
export const productsRoutes = [
  {
    path: "/products",
    element: <ProductsListPage />,
  },
];

// Add to src/routes/index.tsx
import { productsRoutes } from "./products.routes";
// Add ...productsRoutes to children
```

### 4. **Add to Sidebar**

```typescript
// src/components/layout/AppSidebar.tsx
const navItems = [
  // ... existing items
  {
    name: "Products",
    nameKey: "products",
    icon: <PageIcon />,
    subItems: [
      { name: "All Products", nameKey: "allProducts", path: "/products" },
    ],
  },
];
```

### 5. **Add Translations**

```typescript
// src/i18n/locales/ar/sidebar.ts
export const sidebar = {
  // ... existing translations
  products: "المنتجات",
  allProducts: "كل المنتجات",
};
```

## 🔧 Technologies Used

- **React 19** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **React Router 7** - Routing
- **TanStack Query** - Server State
- **Zustand** - Client State
- **Shadcn UI** - UI Components
- **Tailwind CSS** - Styling
- **Axios** - HTTP Client
- **i18next** - Internationalization

## 🎨 Customization

### Change Theme Colors

Edit `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      brand: {
        // Your brand colors
      }
    }
  }
}
```

### Update API Base URL

Edit `.env`:

```
VITE_API_BASE_URL=your-api-url
```

## 📝 Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Dashboard
```

## 🚀 Deployment

```bash
# Build
npm run build

# Preview build
npm run preview
```

## 📄 License

MIT

## 🤝 Contributing

Feel free to use this template for your projects!
└── i18n/ # ترجمة التطبيق

````

## 🎯 الميزات الرئيسية

✅ **أمان محسّن**

- نظام مصادقة وتفويض قوي
- حماية من CSRF و XSS
- التحكم في الوصول بناءً على الصلاحيات

✅ **أداء عالي**

- Lazy Loading للصفحات
- React Query للتخزين المؤقت
- Code Splitting تلقائي

✅ **قابلية الصيانة**

- TypeScript كامل
- بنية معمارية واضحة
- تعليقات شاملة

✅ **تجربة مستخدم ممتازة**

- واجهة سلسة وسريعة
- دعم اللغة العربية والإنجليزية
- وضع مظلم/فاتح

## 📝 الأوامر المتاحة

```bash
npm run dev          # تشغيل سيرفر التطوير
npm run build        # بناء للإنتاج
npm run preview      # معاينة build الإنتاج
npm run lint         # فحص الكود
````

## 🔐 المتغيرات البيئية

قم بإنشاء ملف `.env` في المجلد الرئيسي:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
VITE_APP_NAME=ERP System
VITE_APP_VERSION=1.0.0
```

## 👥 المساهمة

نرحب بمساهماتك! الرجاء اتباع:

1. استخدام TypeScript لجميع الملفات الجديدة
2. اتباع هيكل المجلدات الموجود
3. كتابة تعليقات واضحة
4. اختبار التغييرات قبل الـ commit

## 📞 الدعم

للأسئلة أو المشاكل، يرجى التواصل مع فريق التطوير.

---

**الإصدار**: 1.0.0  
**آخر تحديث**: يناير 2026

## Design System Execution Plan
Follow: ./DESIGN_SYSTEM_UNIFICATION_PLAN.md

