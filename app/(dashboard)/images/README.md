# Image Generation Page

This page provides a complete interface for AI-powered image generation.

## Features

### Prompt Input (Requirement 4.1)

- Large textarea for entering image descriptions
- Character counter (max 4000 characters)
- Real-time validation
- Generate button with loading state

### Image Gallery (Requirement 4.2)

- Grid layout displaying all generated images
- Hover overlay with action buttons
- Image metadata display (prompt, model, size, credits)
- Empty state with helpful message

### Size Selector (Requirement 4.3)

- Five size options:
  - Small (256×256)
  - Medium (512×512)
  - Large (1024×1024)
  - Wide (1792×1024)
  - Tall (1024×1792)
- Visual selection with active state
- Disabled during generation

### Style Selector (Requirement 4.4)

- Four style options:
  - Natural
  - Vivid
  - Artistic
  - Photographic
- Visual selection with active state
- Disabled during generation

### Download Functionality (Requirement 4.2)

- Download button on each image
- Automatic filename generation
- Browser-native download
- Error handling

## Additional Features

### Model Selection

- Displays available image generation models
- Shows model capabilities and pricing
- Filters by image-generation capability
- Loading state while fetching models

### Preset Support

- Optional preset templates for common image types
- Applies preset prompt and settings
- Category filtering (image presets only)

### Advanced Options

- Quality selector (Standard/HD)
- Number of images slider (1-4)
- Collapsible panel to reduce clutter

### Error Handling

- Displays API errors clearly
- Dismissible error messages
- Validation feedback
- Network error handling

### Image Management

- Delete images from gallery
- Persistent gallery during session
- Image metadata tracking
- Timestamp for each generation

## API Integration

The page integrates with `/api/ai/images` endpoint:

**Request:**

```typescript
{
  prompt: string;
  model: string;
  provider: 'openai' | 'google';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  style?: 'natural' | 'vivid' | 'artistic' | 'photographic';
  quality?: 'standard' | 'hd';
  n?: number; // 1-10
}
```

**Response (Single Image):**

```typescript
{
  success: true;
  data: {
    id: string;
    url: string;
    credits: number;
  }
}
```

**Response (Multiple Images):**

```typescript
{
  success: true;
  data: {
    images: Array<{
      id: string;
      url: string;
      credits: number;
    }>;
    count: number;
    totalCredits: number;
  }
}
```

## User Experience

1. User enters a descriptive prompt
2. User selects model, size, and style
3. User clicks "Generate Image"
4. Loading state shows generation in progress
5. Generated image(s) appear in gallery
6. User can download or delete images
7. User can generate more images with different settings

## Responsive Design

- Desktop: Two-column layout (content + sidebar)
- Tablet: Stacked layout with full-width components
- Mobile: Single column with optimized touch targets

## Performance Considerations

- Images are loaded lazily
- Gallery uses CSS Grid for efficient layout
- State updates are optimized to prevent unnecessary re-renders
- API calls include proper error handling and timeouts

## Future Enhancements

- Image editing capabilities
- Variation generation from existing images
- Batch download functionality
- Image history persistence
- Sharing capabilities
- Image upscaling options
