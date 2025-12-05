# UI Components

This directory contains reusable UI form components that follow consistent styling and validation patterns.

## Components

### Input

A text input component with validation display, labels, and helper text.

**Props:**

- `label?: string` - Label text displayed above the input
- `error?: string` - Error message displayed below the input
- `helperText?: string` - Helper text displayed below the input (when no error)
- All standard HTML input attributes

**Example:**

```tsx
<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  error={errors.email}
  helperText="We'll never share your email"
  required
/>
```

### Button

A button component with loading states and multiple variants.

**Props:**

- `variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'` - Visual style
- `size?: 'sm' | 'md' | 'lg'` - Button size
- `loading?: boolean` - Shows loading spinner
- `fullWidth?: boolean` - Makes button full width
- All standard HTML button attributes

**Example:**

```tsx
<Button variant="primary" size="md" loading={isSubmitting} type="submit">
  Submit
</Button>
```

### Label

A label component for form fields.

**Props:**

- `required?: boolean` - Shows required indicator (\*)
- All standard HTML label attributes

**Example:**

```tsx
<Label htmlFor="username" required>
  Username
</Label>
```

### Checkbox

A checkbox component with label and validation display.

**Props:**

- `label?: string` - Label text displayed next to checkbox
- `error?: string` - Error message displayed below
- `helperText?: string` - Helper text displayed below (when no error)
- All standard HTML input attributes (except type)

**Example:**

```tsx
<Checkbox
  label="I agree to the terms and conditions"
  error={errors.terms}
  required
/>
```

### Form

A form wrapper component with error handling.

**Props:**

- `errors?: FormError[]` - Array of form errors
- `loading?: boolean` - Form loading state
- All standard HTML form attributes

**FormError Type:**

```typescript
interface FormError {
  field?: string;
  message: string;
}
```

**Example:**

```tsx
<Form onSubmit={handleSubmit} errors={formErrors} loading={isSubmitting}>
  <Input label="Email" name="email" />
  <Button type="submit" loading={isSubmitting}>
    Submit
  </Button>
</Form>
```

## Complete Example

```tsx
import { Form, Input, Button, Checkbox } from '@/components/ui';
import { useState } from 'react';

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Submit form
    } catch (error) {
      setErrors([{ message: 'Login failed' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} errors={errors} loading={loading}>
      <Input
        label="Email"
        type="email"
        name="email"
        required
        error={errors.find((e) => e.field === 'email')?.message}
      />

      <Input
        label="Password"
        type="password"
        name="password"
        required
        error={errors.find((e) => e.field === 'password')?.message}
      />

      <Checkbox label="Remember me" name="remember" />

      <Button type="submit" variant="primary" fullWidth loading={loading}>
        Sign In
      </Button>
    </Form>
  );
}
```

## Styling

All components use Tailwind CSS for styling and follow these principles:

- Consistent spacing and sizing
- Clear focus states for accessibility
- Error states with red color scheme
- Disabled states with reduced opacity
- Smooth transitions for interactive elements
- Responsive design patterns

## Accessibility

All components follow accessibility best practices:

- Proper ARIA attributes
- Keyboard navigation support
- Screen reader friendly
- Error announcements with `role="alert"`
- Proper label associations
- Focus management
