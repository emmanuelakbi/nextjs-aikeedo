# Layout Components

This directory contains layout components for the AIKEEDO Next.js application.

## Components

### MainLayout

The main layout component for authenticated pages. Includes navigation bar, main content area, and footer.

**Props:**

- `children`: React nodes to render in the main content area
- `user`: Current user object (optional)
- `currentWorkspace`: Current workspace object (optional)
- `workspaces`: Array of available workspaces (optional)

**Usage:**

```tsx
import { MainLayout } from '@/components/layouts';

export default function DashboardPage() {
  return (
    <MainLayout
      user={user}
      currentWorkspace={workspace}
      workspaces={workspaces}
    >
      <h1>Dashboard</h1>
      {/* Page content */}
    </MainLayout>
  );
}
```

### AuthLayout

Layout component for authentication pages (login, register, password reset, etc.).

**Props:**

- `children`: React nodes to render in the content card
- `title`: Page title (optional)
- `subtitle`: Page subtitle (optional)

**Usage:**

```tsx
import { AuthLayout } from '@/components/layouts';

export default function LoginPage() {
  return (
    <AuthLayout title="Sign in to your account" subtitle="Welcome back!">
      {/* Login form */}
    </AuthLayout>
  );
}
```

### Navbar

Responsive navigation bar with logo, navigation links, workspace switcher, and user menu.

**Props:**

- `user`: Current user object (optional)
- `currentWorkspace`: Current workspace object (optional)
- `workspaces`: Array of available workspaces (optional)

**Features:**

- Responsive design with mobile menu
- Active link highlighting
- Workspace switcher integration
- User menu integration

### UserMenu

Dropdown menu for user account actions.

**Props:**

- `user`: Current user object with id, email, firstName, lastName, and role

**Features:**

- User avatar with initials
- User info display
- Admin badge for admin users
- Links to profile, settings, and admin dashboard
- Sign out functionality
- Click outside to close
- Keyboard navigation (Escape to close)

### WorkspaceSwitcher

Dropdown component for switching between workspaces.

**Props:**

- `currentWorkspace`: Current workspace object
- `workspaces`: Array of available workspaces
- `mobile`: Boolean flag for mobile styling (optional)

**Features:**

- Workspace list with current workspace highlighted
- Switch workspace functionality with loading state
- Create new workspace link
- Click outside to close
- Keyboard navigation (Escape to close)
- Responsive design for mobile and desktop

## Requirements

These components satisfy the following requirements:

- **11.1**: Responsive layout that works on mobile, tablet, and desktop
- **11.2**: Consistent navigation bar with user menu

## Styling

All components use Tailwind CSS for styling and follow the design system established in the UI components.

## Accessibility

- Proper ARIA attributes for dropdowns and menus
- Keyboard navigation support
- Focus management
- Screen reader friendly
