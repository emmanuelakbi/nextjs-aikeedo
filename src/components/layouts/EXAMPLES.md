# Layout Components - Usage Examples

This document provides practical examples of how to use the layout components in your Next.js pages.

## MainLayout Example

Use `MainLayout` for authenticated pages that need navigation and user context.

### Basic Usage

```tsx
// app/(dashboard)/dashboard/page.tsx
import { MainLayout } from '@/components/layouts';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch user's workspaces
  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    select: {
      id: true,
      name: true,
    },
  });

  // Get current workspace
  const currentWorkspace = await prisma.workspace.findUnique({
    where: { id: session.user.currentWorkspaceId },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <MainLayout
      user={{
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: session.user.role,
      }}
      currentWorkspace={currentWorkspace}
      workspaces={workspaces}
    >
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dashboard content */}
        </div>
      </div>
    </MainLayout>
  );
}
```

### With Custom Content

```tsx
// app/(dashboard)/profile/page.tsx
import { MainLayout } from '@/components/layouts';
import { requireAuth } from '@/lib/auth/session';

export default async function ProfilePage() {
  const session = await requireAuth();

  return (
    <MainLayout user={session.user}>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
          {/* Profile form */}
        </div>
      </div>
    </MainLayout>
  );
}
```

## AuthLayout Example

Use `AuthLayout` for authentication pages like login, register, and password reset.

### Login Page

```tsx
// app/(auth)/login/page.tsx
import { AuthLayout } from '@/components/layouts';
import LoginForm from '@/components/forms/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Welcome back! Please enter your details."
    >
      <LoginForm />

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
```

### Register Page

```tsx
// app/(auth)/register/page.tsx
import { AuthLayout } from '@/components/layouts';
import RegisterForm from '@/components/forms/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get started with AIKEEDO today."
    >
      <RegisterForm />

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
```

### Password Reset Page

```tsx
// app/(auth)/reset-password/page.tsx
import { AuthLayout } from '@/components/layouts';
import ResetPasswordForm from '@/components/forms/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a reset link."
    >
      <ResetPasswordForm />

      <div className="mt-6 text-center">
        <a
          href="/login"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Back to sign in
        </a>
      </div>
    </AuthLayout>
  );
}
```

## Standalone Component Usage

You can also use the individual components separately if needed.

### Navbar Only

```tsx
import { Navbar } from '@/components/layouts';

export default function CustomLayout({ children }) {
  return (
    <div>
      <Navbar
        user={user}
        currentWorkspace={workspace}
        workspaces={workspaces}
      />
      <main>{children}</main>
    </div>
  );
}
```

### UserMenu Only

```tsx
import { UserMenu } from '@/components/layouts';

export default function CustomHeader({ user }) {
  return (
    <header className="flex justify-between items-center p-4">
      <div>Logo</div>
      <UserMenu user={user} />
    </header>
  );
}
```

### WorkspaceSwitcher Only

```tsx
import { WorkspaceSwitcher } from '@/components/layouts';

export default function CustomSidebar({ currentWorkspace, workspaces }) {
  return (
    <aside className="w-64 p-4">
      <WorkspaceSwitcher
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
      />
      {/* Other sidebar content */}
    </aside>
  );
}
```

## Route Groups

To apply layouts to multiple pages, use Next.js route groups:

### Dashboard Route Group

```
app/
├── (dashboard)/
│   ├── layout.tsx          # Applies MainLayout to all dashboard routes
│   ├── dashboard/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   └── workspaces/
│       └── page.tsx
```

```tsx
// app/(dashboard)/layout.tsx
import { MainLayout } from '@/components/layouts';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch workspace data
  // ...

  return (
    <MainLayout
      user={session.user}
      currentWorkspace={workspace}
      workspaces={workspaces}
    >
      {children}
    </MainLayout>
  );
}
```

### Auth Route Group

```
app/
├── (auth)/
│   ├── layout.tsx          # Applies AuthLayout to all auth routes
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── reset-password/
│       └── page.tsx
```

```tsx
// app/(auth)/layout.tsx
import { AuthLayout } from '@/components/layouts';

export default function AuthLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
```

## Responsive Behavior

Both layouts are fully responsive:

- **Mobile (< 640px)**: Hamburger menu, stacked layout
- **Tablet (640px - 1024px)**: Condensed navigation, optimized spacing
- **Desktop (> 1024px)**: Full navigation, optimal spacing

The components automatically adapt to screen size using Tailwind's responsive utilities.

## Accessibility Features

All layout components include:

- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader friendly markup
- Semantic HTML structure

## Customization

You can customize the layouts by:

1. **Extending the components**: Create wrapper components that add additional features
2. **Modifying Tailwind classes**: Pass custom className props where supported
3. **Creating variants**: Copy and modify the components for specific use cases
