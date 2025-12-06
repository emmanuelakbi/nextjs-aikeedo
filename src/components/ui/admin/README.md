# Admin UI Components

This directory contains reusable UI components specifically designed for the admin dashboard. These components provide consistent styling, behavior, and patterns across all admin pages.

## Components Overview

### Layout Components

#### PageHeader

Consistent page header with title, description, breadcrumbs, and action buttons.

```tsx
import { PageHeader } from '@/components/ui/admin';

<PageHeader
  title="User Management"
  description="Manage all users in the system"
  breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]}
  actions={<Button onClick={handleAdd}>Add User</Button>}
/>;
```

#### Card

Reusable card container with optional header and sections.

```tsx
import { Card, CardHeader, CardSection } from '@/components/ui/admin';

<Card>
  <CardHeader
    title="Statistics"
    subtitle="Last 30 days"
    actions={<Button>Export</Button>}
  />
  <CardSection>Content here</CardSection>
  <CardSection divider>More content</CardSection>
</Card>;
```

#### CardGrid

Grid layout for cards.

```tsx
import { CardGrid, Card } from '@/components/ui/admin';

<CardGrid columns={3} gap="md">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</CardGrid>;
```

### Data Display Components

#### DataTable

Comprehensive data table with loading states, empty states, and pagination.

```tsx
import { DataTable, Column } from '@/components/ui/admin';

const columns: Column<User>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (user) => (
      <TableCell.TwoLine
        primary={`${user.firstName} ${user.lastName}`}
        secondary={user.email}
      />
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (user) => (
      <StatusBadge variant={getUserStatusVariant(user.status)}>
        {user.status}
      </StatusBadge>
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    className: 'text-right',
    render: (user) => (
      <TableCell.Actions>
        <TableCell.ActionLink href={`/admin/users/${user.id}`}>
          View
        </TableCell.ActionLink>
        <TableCell.ActionLink
          onClick={() => handleDelete(user.id)}
          variant="danger"
        >
          Delete
        </TableCell.ActionLink>
      </TableCell.Actions>
    ),
  },
];

<DataTable
  columns={columns}
  data={users}
  loading={loading}
  getRowKey={(user) => user.id}
  emptyState={{
    title: 'No users found',
    description: 'Try adjusting your filters',
    icon: EmptyStateIcons.NoUsers,
  }}
  pagination={{
    currentPage: 1,
    totalPages: 10,
    totalItems: 100,
    itemsPerPage: 10,
    onPageChange: (page) => setPage(page),
  }}
/>;
```

#### StatCard

Metric cards for analytics dashboards.

```tsx
import { StatCard } from '@/components/ui/admin';

<StatCard
  title="Total Users"
  value={1234}
  subtitle="+50 new this month"
  icon={<UsersIcon />}
  iconBgColor="bg-blue-100"
  iconColor="text-blue-600"
  trend={{
    value: '+12%',
    isPositive: true,
  }}
/>;
```

#### StatusBadge

Colored status badges with helper functions.

```tsx
import { StatusBadge, getUserStatusVariant } from '@/components/ui/admin';

<StatusBadge variant="success">Active</StatusBadge>
<StatusBadge variant="error">Suspended</StatusBadge>

// With helper functions
<StatusBadge variant={getUserStatusVariant(user.status)}>
  {user.status}
</StatusBadge>
<StatusBadge variant={getSubscriptionStatusVariant(subscription.status)}>
  {subscription.status}
</StatusBadge>
<StatusBadge variant={getUserRoleVariant(user.role)}>
  {user.role}
</StatusBadge>
```

### Interaction Components

#### Modal

Reusable modal dialog with header, body, and footer.

```tsx
import { Modal } from '@/components/ui/admin';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit User"
  size="md"
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSave}>
        Save
      </Button>
    </>
  }
>
  <form>{/* Form content */}</form>
</Modal>;
```

#### ConfirmModal

Specialized confirmation dialog.

```tsx
import { ConfirmModal } from '@/components/ui/admin';

<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete User"
  message="Are you sure you want to delete this user? This action cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  variant="danger"
  isLoading={deleting}
/>;
```

#### FilterBar

Filter interface with inputs and actions.

```tsx
import {
  FilterBar,
  FilterGrid,
  FilterInput,
  FilterSelect,
} from '@/components/ui/admin';

<FilterBar onApply={handleApplyFilters} onClear={handleClearFilters}>
  <FilterGrid columns={4}>
    <FilterInput
      label="Search"
      value={search}
      onChange={setSearch}
      placeholder="Email, name..."
    />
    <FilterSelect
      label="Status"
      value={statusFilter}
      onChange={setStatusFilter}
      options={[
        { value: 'ACTIVE', label: 'Active' },
        { value: 'SUSPENDED', label: 'Suspended' },
      ]}
    />
    <FilterSelect
      label="Role"
      value={roleFilter}
      onChange={setRoleFilter}
      options={[
        { value: 'USER', label: 'User' },
        { value: 'ADMIN', label: 'Admin' },
      ]}
    />
    <FilterInput
      label="Created After"
      value={dateFilter}
      onChange={setDateFilter}
      type="date"
    />
  </FilterGrid>
</FilterBar>;
```

#### Pagination

Pagination controls for tables and lists.

```tsx
import { Pagination } from '@/components/ui/admin';

<Pagination
  currentPage={page}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={20}
  onPageChange={setPage}
  showItemRange={true}
/>;
```

#### SimplePagination

Simpler pagination with just prev/next buttons.

```tsx
import { SimplePagination } from '@/components/ui/admin';

<SimplePagination
  hasMore={hasMore}
  onNext={handleNext}
  onPrevious={handlePrevious}
  canGoPrevious={offset > 0}
  currentInfo={`Showing ${offset + 1} to ${offset + limit}`}
/>;
```

#### QuickAction

Quick action cards for common tasks.

```tsx
import { QuickAction, QuickActionsGrid } from '@/components/ui/admin';

<QuickActionsGrid columns={6}>
  <QuickAction
    title="Manage Users"
    description="1,234 total"
    href="/admin/users"
    icon={<UsersIcon />}
  />
  <QuickAction
    title="View Reports"
    description="Export data"
    onClick={handleExport}
  />
</QuickActionsGrid>;
```

### State Components

#### LoadingSpinner

Loading indicator with optional message.

```tsx
import { LoadingSpinner } from '@/components/ui/admin';

<LoadingSpinner message="Loading users..." size="md" />
<LoadingSpinner fullScreen /> // Full screen loading
```

#### EmptyState

Empty state placeholder with icon and optional action.

```tsx
import { EmptyState, EmptyStateIcons } from '@/components/ui/admin';

<EmptyState
  icon={EmptyStateIcons.NoUsers}
  title="No users found"
  description="Try adjusting your filters or create a new user"
  action={{
    label: 'Create User',
    onClick: handleCreate,
  }}
/>;
```

### Impersonation Components

#### ImpersonationButton

Button to start impersonating a user.

```tsx
import { ImpersonationButton } from '@/components/ui/admin';

<ImpersonationButton
  userId={user.id}
  userEmail={user.email}
  userName={`${user.firstName} ${user.lastName}`}
  onSuccess={() => console.log('Impersonation started')}
/>;
```

#### ActiveImpersonations

Display active impersonation sessions.

```tsx
import { ActiveImpersonations } from '@/components/ui/admin';

<ActiveImpersonations />;
```

## Design Principles

1. **Consistency**: All components follow the same design patterns and styling
2. **Reusability**: Components are generic and can be used across different admin pages
3. **Accessibility**: Components include proper ARIA labels and keyboard navigation
4. **Responsive**: All components work on mobile, tablet, and desktop
5. **Type Safety**: Full TypeScript support with proper types and interfaces

## Color Palette

### Status Colors

- Success: `bg-green-100 text-green-800`
- Warning: `bg-orange-100 text-orange-800`
- Error: `bg-red-100 text-red-800`
- Info: `bg-blue-100 text-blue-800`
- Neutral: `bg-gray-100 text-gray-800`
- Purple: `bg-purple-100 text-purple-800`

### Icon Background Colors

- Blue: `bg-blue-100` with `text-blue-600`
- Purple: `bg-purple-100` with `text-purple-600`
- Green: `bg-green-100` with `text-green-600`
- Indigo: `bg-indigo-100` with `text-indigo-600`

## Best Practices

1. **Use DataTable for lists**: Instead of building custom tables, use the DataTable component
2. **Consistent filtering**: Use FilterBar components for all list views
3. **Loading states**: Always show LoadingSpinner while fetching data
4. **Empty states**: Use EmptyState when no data is available
5. **Confirmations**: Use ConfirmModal for destructive actions
6. **Status badges**: Use StatusBadge with helper functions for consistent status display
7. **Page structure**: Start pages with PageHeader for consistency

## Example: Complete Admin Page

```tsx
'use client';

import { useState, useEffect } from 'react';
import {
  PageHeader,
  DataTable,
  Column,
  TableCell,
  FilterBar,
  FilterGrid,
  FilterInput,
  FilterSelect,
  StatusBadge,
  getUserStatusVariant,
  LoadingSpinner,
  EmptyStateIcons,
  ConfirmModal,
} from '@/components/ui/admin';
import { Button } from '@/components/ui/Button';

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteUser, setDeleteUser] = useState(null);

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      render: (user) => (
        <TableCell.TwoLine
          primary={`${user.firstName} ${user.lastName}`}
          secondary={user.email}
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <StatusBadge variant={getUserStatusVariant(user.status)}>
          {user.status}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (user) => (
        <TableCell.Actions>
          <TableCell.ActionLink href={`/admin/users/${user.id}`}>
            View
          </TableCell.ActionLink>
          <TableCell.ActionLink
            onClick={() => setDeleteUser(user)}
            variant="danger"
          >
            Delete
          </TableCell.ActionLink>
        </TableCell.Actions>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="User Management"
        description="Manage all users in the system"
        actions={<Button>Add User</Button>}
      />

      <FilterBar onApply={handleFilter} onClear={handleClear}>
        <FilterGrid columns={3}>
          <FilterInput label="Search" value={search} onChange={setSearch} />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={statusOptions}
          />
          <FilterSelect
            label="Role"
            value={role}
            onChange={setRole}
            options={roleOptions}
          />
        </FilterGrid>
      </FilterBar>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        getRowKey={(user) => user.id}
        emptyState={{
          title: 'No users found',
          icon: EmptyStateIcons.NoUsers,
        }}
        pagination={pagination}
      />

      <ConfirmModal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteUser?.email}?`}
        variant="danger"
      />
    </div>
  );
}
```

## Requirements Coverage

These components fulfill the following admin dashboard requirements:

- **Requirement 1**: User Management - DataTable, FilterBar, StatusBadge, ImpersonationButton
- **Requirement 2**: Workspace Management - DataTable, FilterBar, StatusBadge
- **Requirement 3**: Subscription Management - DataTable, FilterBar, StatusBadge
- **Requirement 4**: System Settings - Card, Modal, FilterBar
- **Requirement 5**: Analytics and Reporting - StatCard, QuickAction, CardGrid
- **Requirement 6**: Content Moderation - DataTable, FilterBar, Modal
- **Requirement 7**: Support Tools - Card, Modal, QuickAction
- **Requirement 8**: Audit Logging - DataTable, FilterBar, Modal
