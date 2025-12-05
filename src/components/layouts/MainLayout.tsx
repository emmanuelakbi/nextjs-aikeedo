import React from 'react';
import Navbar from './Navbar';

/**
 * Main layout component for authenticated pages
 * Requirements: 11.1, 11.2
 */

interface MainLayoutProps {
  children: React.ReactNode;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  currentWorkspace?: {
    id: string;
    name: string;
  };
  workspaces?: Array<{
    id: string;
    name: string;
  }>;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  user,
  currentWorkspace,
  workspaces = [],
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation bar */}
      <Navbar
        user={user}
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
      />

      {/* Main content */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} AIKEEDO. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a
                href="/terms"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Terms
              </a>
              <a
                href="/privacy"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Privacy
              </a>
              <a
                href="/support"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
