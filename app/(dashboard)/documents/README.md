# Documents Page

Document management interface for creating, editing, and organizing generated content.

## Features

### Document List

- View all documents in the workspace
- Search documents by title and content
- Filter by document type (TEXT, IMAGE, AUDIO)
- Delete documents with confirmation
- Visual indicators for document types
- Relative timestamps (Today, Yesterday, X days ago)

### Document Editor

- Create new documents
- Edit existing documents
- Auto-save indicator
- Character count
- Keyboard shortcuts (Cmd/Ctrl + S to save)
- Unsaved changes warning
- Document type selection (TEXT, IMAGE, AUDIO)

### Layout

- Split view with document list on the left
- Editor on the right
- Responsive design for mobile and desktop
- Empty state when no document is selected

## Requirements Satisfied

- **Content Management 2.1**: Store generated content (text, images, audio)
- **Content Management 2.2**: Organize by workspace and user
- **Content Management 2.3**: Support search and filtering

## API Integration

The page integrates with the following API endpoints:

- `GET /api/documents` - List documents with search and filter
- `POST /api/documents` - Create new document
- `GET /api/documents/:id` - Get single document
- `PATCH /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

## Components

### DocumentsPage

Main page component that manages state and coordinates between list and editor.

**State:**

- `documents` - Array of documents
- `selectedDocument` - Currently selected document
- `isLoading` - Loading state
- `error` - Error message
- `searchQuery` - Search query string
- `filterType` - Document type filter
- `isCreating` - Creating new document flag

**Methods:**

- `loadDocuments()` - Fetch documents from API
- `handleCreateNew()` - Start creating new document
- `handleSelectDocument()` - Select document for editing
- `handleSaveDocument()` - Save document (create or update)
- `handleDeleteDocument()` - Delete document
- `handleCloseEditor()` - Close editor

### DocumentList

Displays list of documents with search and filter controls.

**Props:**

- `documents` - Array of documents to display
- `selectedDocumentId` - ID of currently selected document
- `onSelectDocument` - Callback when document is selected
- `onDeleteDocument` - Callback when document is deleted
- `searchQuery` - Current search query
- `onSearchChange` - Callback when search query changes
- `filterType` - Current filter type
- `onFilterChange` - Callback when filter changes

**Features:**

- Search input with real-time filtering
- Type filter buttons (All, Text, Image, Audio)
- Document cards with title, preview, and timestamp
- Delete button with confirmation
- Type icons for visual identification

### DocumentEditor

Rich text editor for creating and editing documents.

**Props:**

- `document` - Document to edit (null for new document)
- `onSave` - Callback to save document
- `onClose` - Callback to close editor

**Features:**

- Title input
- Type selector (TEXT, IMAGE, AUDIO)
- Large textarea for content
- Character count
- Save button with loading state
- Close button with unsaved changes warning
- Last saved timestamp
- Keyboard shortcuts (Cmd/Ctrl + S)

## Usage

```typescript
import DocumentsPage from '@/app/(dashboard)/documents/page';

// The page is automatically rendered at /dashboard/documents
```

## Keyboard Shortcuts

- `Cmd/Ctrl + S` - Save current document

## Future Enhancements

- Rich text formatting (bold, italic, lists)
- Markdown support
- Document templates
- Version history
- Collaborative editing
- Export to PDF/Word
- Document sharing
- Tags and categories
- Bulk operations
