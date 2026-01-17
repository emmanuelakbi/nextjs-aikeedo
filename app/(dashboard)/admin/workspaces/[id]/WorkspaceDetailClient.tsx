'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Workspace Detail Client Component
 *
 * Requirements: Admin Dashboard 2 - Workspace Management
 */

interface WorkspaceDetailClientProps {
  workspaceId: string;
}

export function WorkspaceDetailClient({
  workspaceId,
}: WorkspaceDetailClientProps) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAdjustment, setCreditAdjustment] = useState({
    type: 'add' as 'add' | 'subtract',
    amount: 0,
    reason: '',
  });

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  const fetchWorkspace = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/workspaces/${workspaceId}`);
      const data = await response.json();

      if (response.ok) {
        setWorkspace(data.workspace);
      } else {
        console.error('Failed to fetch workspace:', data.error);
      }
    } catch (error) {
      console.error('Error fetching workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreditAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (creditAdjustment.amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    if (!creditAdjustment.reason.trim()) {
      alert('Please provide a reason for the adjustment');
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/workspaces/${workspaceId}/credits`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creditAdjustment),
        }
      );

      if (response.ok) {
        setShowCreditModal(false);
        setCreditAdjustment({ type: 'add', amount: 0, reason: '' });
        fetchWorkspace();
      } else {
        const data = await response.json();
        alert(`Failed to adjust credits: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adjusting credits:', error);
      alert('Failed to adjust credits');
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete this workspace? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/workspaces/${workspaceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/workspaces');
      } else {
        const data = await response.json();
        alert(`Failed to delete workspace: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      alert('Failed to delete workspace');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Workspace not found</p>
        <button
          onClick={() => router.push('/admin/workspaces')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Workspaces
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
            onClick={() => router.push('/admin/workspaces')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Workspaces
          </button>
          <h1 className="text-3xl font-bold">{workspace.name}</h1>
          <p className="text-gray-600">
            Owner: {workspace.owner.firstName} {workspace.owner.lastName} (
            {workspace.owner.email})
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreditModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Adjust Credits
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Workspace
          </button>
        </div>
      </div>

      {/* Credits Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Current Balance</p>
            <p className="text-3xl font-bold">
              {workspace.creditCount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Allocated Credits</p>
            <p className="text-3xl font-bold">
              {workspace.allocatedCredits.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Purchased Credits</p>
            <p className="text-3xl font-bold">
              {(
                workspace.creditCount - workspace.allocatedCredits
              ).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Information */}
      {workspace.subscription && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Subscription</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="font-medium">{workspace.subscription.plan.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium">{workspace.subscription.status}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Members</p>
            <p className="text-2xl font-bold">{workspace._count.members}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Conversations</p>
            <p className="text-2xl font-bold">
              {workspace._count.conversations}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Generations</p>
            <p className="text-2xl font-bold">{workspace._count.generations}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Files</p>
            <p className="text-2xl font-bold">{workspace._count.files}</p>
          </div>
        </div>
      </div>

      {/* Recent Credit Transactions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Recent Credit Transactions
        </h2>
        {workspace.creditTransactions.length === 0 ? (
          <p className="text-gray-600">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {workspace.creditTransactions.map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center p-3 border border-gray-200 rounded-md"
              >
                <div>
                  <p className="font-medium">
                    {transaction.amount > 0 ? '+' : ''}
                    {transaction.amount.toLocaleString()} credits
                  </p>
                  <p className="text-sm text-gray-600">{transaction.type}</p>
                  {transaction.description && (
                    <p className="text-xs text-gray-500">
                      {transaction.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Balance: {transaction.balanceAfter.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credit Adjustment Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Adjust Credits</h3>
            <form onSubmit={handleCreditAdjustment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={creditAdjustment.type}
                  onChange={(e) =>
                    setCreditAdjustment({
                      ...creditAdjustment,
                      type: e.target.value as 'add' | 'subtract',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="add">Add Credits</option>
                  <option value="subtract">Subtract Credits</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={creditAdjustment.amount}
                  onChange={(e) =>
                    setCreditAdjustment({
                      ...creditAdjustment,
                      amount: parseInt(e.target.value) || 0,
                    })
                  }
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={creditAdjustment.reason}
                  onChange={(e) =>
                    setCreditAdjustment({
                      ...creditAdjustment,
                      reason: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Adjust Credits
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreditModal(false);
                    setCreditAdjustment({ type: 'add', amount: 0, reason: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
