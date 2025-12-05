'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import { useToast } from '@/components/ui/ToastContainer';

/**
 * Create workspace button and modal component
 * Requirements: 8.1, 8.2
 */

const CreateWorkspaceButton: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.fields?.name) {
          setError(data.error.fields.name[0]);
        } else {
          throw new Error(data.error?.message || 'Failed to create workspace');
        }
        return;
      }

      toast.success('Workspace created successfully');
      setIsOpen(false);
      setName('');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create workspace'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <svg
          className="-ml-1 mr-2 h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Create Workspace
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Create New Workspace
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Create a new workspace to organize your work and
                      collaborate with your team.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-5">
                  <div>
                    <Label htmlFor="workspace-name">Workspace Name</Label>
                    <Input
                      id="workspace-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError('');
                      }}
                      error={error}
                      placeholder="My Workspace"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <Button
                      type="submit"
                      loading={isLoading}
                      className="w-full sm:col-start-2"
                    >
                      Create
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsOpen(false)}
                      disabled={isLoading}
                      className="mt-3 w-full sm:mt-0 sm:col-start-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateWorkspaceButton;
