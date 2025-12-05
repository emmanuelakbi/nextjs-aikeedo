'use client';

import React, { useState } from 'react';
import { useToast, Spinner, ErrorMessage, SuccessMessage } from '../index';

/**
 * Example component demonstrating the usage of feedback components
 * This file is for reference and testing purposes
 */
export default function FeedbackExamples() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleToastSuccess = () => {
    toast.success('Operation completed successfully!');
  };

  const handleToastError = () => {
    toast.error('Something went wrong!');
  };

  const handleToastWarning = () => {
    toast.warning('Please review your input');
  };

  const handleToastInfo = () => {
    toast.info('Here is some information');
  };

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  const handleRetry = () => {
    console.log('Retry clicked');
    setShowError(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Feedback Components Examples</h1>

      {/* Toast Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Toast Notifications</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleToastSuccess}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Show Success Toast
          </button>
          <button
            onClick={handleToastError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Show Error Toast
          </button>
          <button
            onClick={handleToastWarning}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Show Warning Toast
          </button>
          <button
            onClick={handleToastInfo}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Show Info Toast
          </button>
        </div>
      </section>

      {/* Spinner Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Loading Spinners</h2>
        <div className="flex items-center gap-8">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Small</p>
            <Spinner size="sm" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Medium</p>
            <Spinner size="md" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Large</p>
            <Spinner size="lg" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Extra Large</p>
            <Spinner size="xl" />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleLoadingDemo}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Spinner size="sm" color="white" />}
            {loading ? 'Loading...' : 'Simulate Loading'}
          </button>
        </div>
      </section>

      {/* Error Message Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Error Messages</h2>
        <button
          onClick={() => setShowError(!showError)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {showError ? 'Hide' : 'Show'} Error Message
        </button>
        {showError && (
          <div className="space-y-4">
            <ErrorMessage
              variant="inline"
              message="This is an inline error message"
            />
            <ErrorMessage
              variant="card"
              title="Connection Error"
              message="Unable to connect to the server. Please check your internet connection."
              onRetry={handleRetry}
            />
            <ErrorMessage
              variant="banner"
              message="This is a banner-style error message"
            />
          </div>
        )}
      </section>

      {/* Success Message Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Success Messages</h2>
        <button
          onClick={() => setShowSuccess(!showSuccess)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {showSuccess ? 'Hide' : 'Show'} Success Message
        </button>
        {showSuccess && (
          <div className="space-y-4">
            <SuccessMessage
              variant="inline"
              message="This is an inline success message"
            />
            <SuccessMessage
              variant="card"
              title="Profile Updated"
              message="Your profile has been successfully updated."
              onDismiss={() => setShowSuccess(false)}
            />
            <SuccessMessage
              variant="banner"
              message="This is a banner-style success message"
            />
          </div>
        )}
      </section>
    </div>
  );
}
