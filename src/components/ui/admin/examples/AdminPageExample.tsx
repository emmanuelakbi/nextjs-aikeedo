'use client';

/**
 * Admin Page Example
 *
 * This is a complete example showing how to use all admin UI components together.
 * This file is for reference only and should not be imported in production code.
 */

import { useState } from 'react';
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
  EmptyStateIcons,
  ConfirmModal,
  Card,
  CardHeader,
  CardGrid,
  StatCard,
  QuickAction,
  QuickActionsGrid,
} from '@/components/ui/admin';
import Button from '@/components/ui/Button';

// Example data types
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  role: 'USER' | 'ADMIN';
  createdAt: Date;
}

export function AdminPageExample() {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  // Table columns
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
      key: 'role',
      header: 'Role',
      render: (user) => (
        <StatusBadge variant={user.role === 'ADMIN' ? 'purple' : 'blue'}>
          {user.role}
        </StatusBadge>
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
      key: 'created',
      header: 'Created',
      render: (user) => (
        <TableCell.Text>
          {new Date(user.createdAt).toLocaleDateString()}
        </TableCell.Text>
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
            onClick={() => handleEdit(user)}
            variant="primary"
          >
            Edit
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

  // Handlers
  const handleFilter = () => {
    console.log('Applying filters:', { search, statusFilter, roleFilter });
    // Fetch filtered data
  };

  const handleClear = () => {
    setSearch('');
    setStatusFilter('');
    setRoleFilter('');
  };

  const handleEdit = (user: User) => {
    console.log('Edit user:', user);
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    console.log('Delete user:', deleteUser);
    setDeleteUser(null);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Page Header */}
      <PageHeader
        title="User Management"
        description="Manage all users in the system"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]}
        actions={
          <>
            <Button variant="secondary">Export</Button>
            <Button variant="primary">Add User</Button>
          </>
        }
      />

      {/* Stats Cards */}
      <CardGrid columns={4} gap="md">
        <StatCard
          title="Total Users"
          value="1,234"
          subtitle="+50 new this month"
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          trend={{
            value: '+12%',
            isPositive: true,
          }}
        />
        <StatCard
          title="Active Users"
          value="1,100"
          subtitle="89% of total"
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Suspended"
          value="34"
          subtitle="3% of total"
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
        <StatCard
          title="Admins"
          value="12"
          subtitle="1% of total"
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </CardGrid>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader title="Quick Actions" />
        <QuickActionsGrid columns={6}>
          <QuickAction
            title="View All"
            description="1,234 users"
            href="/admin/users"
          />
          <QuickAction
            title="Active Only"
            description="1,100 users"
            onClick={() => setStatusFilter('ACTIVE')}
          />
          <QuickAction
            title="Suspended"
            description="34 users"
            onClick={() => setStatusFilter('SUSPENDED')}
          />
          <QuickAction
            title="Admins"
            description="12 users"
            onClick={() => setRoleFilter('ADMIN')}
          />
          <QuickAction
            title="Export CSV"
            description="Download"
            onClick={() => console.log('Export')}
          />
          <QuickAction
            title="Import"
            description="Bulk upload"
            onClick={() => console.log('Import')}
          />
        </QuickActionsGrid>
      </Card>

      {/* Filters */}
      <FilterBar onApply={handleFilter} onClear={handleClear}>
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
              { value: 'INACTIVE', label: 'Inactive' },
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
            value=""
            onChange={() => {}}
            type="date"
          />
        </FilterGrid>
      </FilterBar>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        getRowKey={(user) => user.id}
        emptyState={{
          title: 'No users found',
          description: 'Try adjusting your filters or create a new user',
          icon: EmptyStateIcons.NoUsers,
        }}
        pagination={{
          currentPage: page,
          totalPages: 10,
          totalItems: 100,
          itemsPerPage: 10,
          onPageChange: setPage,
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={
          deleteUser
            ? `Are you sure you want to delete ${deleteUser.email}? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
