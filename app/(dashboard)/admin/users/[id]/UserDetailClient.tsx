'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, UserStatus } from '@/domain/user/types';

/**
 * User Detail Client Component
 *
 * Requirements: Admin Dashboard 1 - User Management
 */

interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  phoneNumber: string | null;
  language: string;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date | null;
  ownedWorkspaces: Array<{
    id: string;
    name: string;
    creditCount: number;
    createdAt: Date;
  }>;
  workspaceMembers: Array<{
    workspace: {
      id: string;
      name: string;
    };
  }>;
  affiliate: {
    id: string;
    code: string;
    status: string;
    totalEarnings: number;
    pendingEarnings: number;
  } | null;
  _count: {
    conversations: number;
    generations: number;
    files: number;
    documents: number;
  };
}

interface UserDetailClientProps {
  userId: string;
}

export function UserDetailClient({ userId }: UserDetailClientProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'USER' as UserRole,
    status: 'ACTIVE' as UserStatus,
  });

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setFormData({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          phoneNumber: data.user.phoneNumber || '',
          role: data.user.role,
          status: data.user.status,
        });
      } else {
        console.error('Failed to fetch user:', data.error);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setEditing(false);
        fetchUser();
      } else {
        const data = await response.json();
        alert(`Failed to update user: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleStatusChange = async (status: UserStatus) => {
    if (
      !confirm(
        `Are you sure you want to change this user's status to ${status}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchUser();
      } else {
        const data = await response.json();
        alert(`Failed to update status: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete this user? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/users');
      } else {
        const data = await response.json();
        alert(`Failed to delete user: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">User not found</p>
        <button
          onClick={() => router.push('/admin/users')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => router.push('/admin/users')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Users
          </button>
          <h1 className="text-3xl font-bold">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit User
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete User
          </button>
        </div>
      </div>

      {/* User Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as UserRole,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as UserStatus,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phoneNumber: user.phoneNumber || '',
                    role: user.role,
                    status: user.status,
                  });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-medium">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium">{user.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone Number</p>
              <p className="font-medium">{user.phoneNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Language</p>
              <p className="font-medium">{user.language}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email Verified</p>
              <p className="font-medium">
                {user.emailVerified
                  ? new Date(user.emailVerified).toLocaleDateString()
                  : 'Not verified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Seen</p>
              <p className="font-medium">
                {user.lastSeenAt
                  ? new Date(user.lastSeenAt).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Joined</p>
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {!editing && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-2">
            {user.status === UserStatus.ACTIVE && (
              <button
                onClick={() => handleStatusChange(UserStatus.SUSPENDED)}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Suspend User
              </button>
            )}
            {user.status === UserStatus.SUSPENDED && (
              <button
                onClick={() => handleStatusChange(UserStatus.ACTIVE)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Activate User
              </button>
            )}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Workspaces</p>
            <p className="text-2xl font-bold">{user.ownedWorkspaces.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Conversations</p>
            <p className="text-2xl font-bold">{user._count.conversations}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Generations</p>
            <p className="text-2xl font-bold">{user._count.generations}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Files</p>
            <p className="text-2xl font-bold">{user._count.files}</p>
          </div>
        </div>
      </div>

      {/* Workspaces */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Workspaces</h2>
        {user.ownedWorkspaces.length === 0 ? (
          <p className="text-gray-600">No workspaces</p>
        ) : (
          <div className="space-y-2">
            {user.ownedWorkspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="flex justify-between items-center p-3 border border-gray-200 rounded-md"
              >
                <div>
                  <p className="font-medium">{workspace.name}</p>
                  <p className="text-sm text-gray-600">
                    {workspace.creditCount} credits
                  </p>
                </div>
                <a
                  href={`/admin/workspaces/${workspace.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  View →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Affiliate Info */}
      {user.affiliate && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Affiliate Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Referral Code</p>
              <p className="font-medium font-mono">{user.affiliate.code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium">{user.affiliate.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="font-medium">
                ${(user.affiliate.totalEarnings / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
