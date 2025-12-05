# Feedback Components

This document describes the feedback UI components available in the application.

## Toast Notifications

Toast notifications provide temporary, non-intrusive feedback to users about actions or events.

### Basic Usage

```tsx
import { Toast } from '@/components/ui';

<Toast
  type="success"
  message="Profile updated successfully!"
  duration={5000}
/>;
```

### With ToastProvider (Recommended)

```tsx
// In your root layout
import { ToastProvider } from '@/components/ui';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

// In any component
import { useToast } from '@/components/ui';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Operation completed!');
  };

  const handleError = () => {
    toast.error('Something went wrong!');
  };

  return <button onClick={handleSuccess}>Save</button>;
}
```

### Props

- `type`: 'success' | 'error' | 'warning' | 'info' (default: 'info')
- `message`: string (required)
- `duration`: number in milliseconds (default: 5000, 0 for persistent)
- `position`: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
- `onClose`: callback function

### useToast Hook Methods

- `toast.success(message, duration?)`: Show success toast
- `toast.error(message, duration?)`: Show error toast
- `toast.warning(message, duration?)`: Show warning toast
- `toast.info(message, duration?)`: Show info toast
- `toast.showToast(message, type, duration?)`: Show custom toast

## Spinner

Loading spinner component for indicating loading states.

### Usage

```tsx
import { Spinner } from '@/components/ui';

// Basic spinner
<Spinner />

// Custom size and color
<Spinner size="lg" color="primary" />

// With custom label
<Spinner label="Loading data..." />

// In a centered container
<div className="flex items-center justify-center h-screen">
  <Spinner size="xl" />
</div>
```

### Props

- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `color`: 'primary' | 'secondary' | 'white' | 'gray' (default: 'primary')
- `label`: string (default: 'Loading...')
- `className`: additional CSS classes

### Sizes

- `sm`: 16px (1rem)
- `md`: 32px (2rem)
- `lg`: 48px (3rem)
- `xl`: 64px (4rem)

## ErrorMessage

Display error messages with optional retry functionality.

### Usage

```tsx
import { ErrorMessage } from '@/components/ui';

// Basic error
<ErrorMessage message="Failed to load data" />

// With custom title
<ErrorMessage
  title="Connection Error"
  message="Unable to connect to the server"
/>

// With retry button
<ErrorMessage
  message="Failed to save changes"
  onRetry={() => handleRetry()}
/>

// Different variants
<ErrorMessage message="Error" variant="inline" />
<ErrorMessage message="Error" variant="card" />
<ErrorMessage message="Error" variant="banner" />
```

### Props

- `message`: string (required)
- `title`: string (default: 'Error')
- `onRetry`: callback function (optional, shows retry button)
- `variant`: 'inline' | 'card' | 'banner' (default: 'inline')
- `className`: additional CSS classes

### Variants

- `inline`: Compact error message with minimal padding
- `card`: Card-style with more padding and shadow
- `banner`: Full-width banner with left border accent

## SuccessMessage

Display success messages with optional dismiss functionality.

### Usage

```tsx
import { SuccessMessage } from '@/components/ui';

// Basic success message
<SuccessMessage message="Changes saved successfully" />

// With custom title
<SuccessMessage
  title="Profile Updated"
  message="Your profile has been updated successfully"
/>

// With dismiss button
<SuccessMessage
  message="Email verified"
  onDismiss={() => handleDismiss()}
/>

// Different variants
<SuccessMessage message="Success" variant="inline" />
<SuccessMessage message="Success" variant="card" />
<SuccessMessage message="Success" variant="banner" />
```

### Props

- `message`: string (required)
- `title`: string (default: 'Success')
- `onDismiss`: callback function (optional, shows dismiss button)
- `variant`: 'inline' | 'card' | 'banner' (default: 'inline')
- `className`: additional CSS classes

### Variants

- `inline`: Compact success message with minimal padding
- `card`: Card-style with more padding and shadow
- `banner`: Full-width banner with left border accent

## Accessibility

All feedback components follow accessibility best practices:

- **Toast**: Uses `role="alert"` and `aria-live="polite"` for screen reader announcements
- **Spinner**: Includes `role="status"` and `aria-label` with screen reader text
- **ErrorMessage**: Uses `role="alert"` for immediate screen reader notification
- **SuccessMessage**: Uses `role="status"` and `aria-live="polite"` for non-intrusive announcements
- All interactive elements have proper focus states and keyboard navigation

## Examples

### Form Submission with Feedback

```tsx
'use client';

import { useState } from 'react';
import { useToast, Spinner, ErrorMessage } from '@/components/ui';

function ProfileForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateProfile(data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage message={error} onRetry={handleSubmit} />}

      {/* Form fields */}

      <button type="submit" disabled={loading}>
        {loading ? <Spinner size="sm" color="white" /> : 'Save Changes'}
      </button>
    </form>
  );
}
```

### Loading State

```tsx
import { Spinner } from '@/components/ui';

function DataList() {
  const { data, loading, error } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" label="Loading data..." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return <div>{/* Render data */}</div>;
}
```

### Success Confirmation

```tsx
import { SuccessMessage } from '@/components/ui';

function VerificationPage() {
  const [verified, setVerified] = useState(false);

  if (verified) {
    return (
      <SuccessMessage
        variant="card"
        title="Email Verified"
        message="Your email has been successfully verified. You can now access all features."
      />
    );
  }

  return <div>{/* Verification form */}</div>;
}
```
