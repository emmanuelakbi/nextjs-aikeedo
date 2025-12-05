# Document Editor Architecture

## Component Hierarchy

```
DocumentsPage (page.tsx)
├── Header
│   ├── Title & Description
│   └── "New Document" Button
│
├── DocumentList (left panel)
│   ├── Search Input
│   ├── Filter Buttons (All, Text, Image, Audio)
│   └── Document Cards
│       ├── Type Icon
│       ├── Title
│       ├── Content Preview
│       ├── Timestamp
│       └── Delete Button
│
└── DocumentEditor (right panel)
    ├── Header
    │   ├── Title ("Edit Document" / "New Document")
    │   ├── Last Saved Timestamp
    │   ├── Save Button
    │   └── Close Button
    ├── Title Input
    ├── Type Selector (TEXT, IMAGE, AUDIO)
    ├── Content Textarea
    ├── Character Count
    └── Keyboard Shortcuts Info
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       DocumentsPage                          │
│                                                              │
│  State:                                                      │
│  - documents: Document[]                                     │
│  - selectedDocument: Document | null                         │
│  - searchQuery: string                                       │
│  - filterType: 'ALL' | 'TEXT' | 'IMAGE' | 'AUDIO'          │
│  - isCreating: boolean                                       │
│                                                              │
│  ┌──────────────────────┐      ┌──────────────────────┐   │
│  │   DocumentList       │      │   DocumentEditor      │   │
│  │                      │      │                       │   │
│  │  Props:              │      │  Props:               │   │
│  │  - documents         │      │  - document           │   │
│  │  - selectedDocumentId│      │  - onSave             │   │
│  │  - onSelectDocument  │      │  - onClose            │   │
│  │  - onDeleteDocument  │      │                       │   │
│  │  - searchQuery       │      │  State:               │   │
│  │  - onSearchChange    │      │  - title              │   │
│  │  - filterType        │      │  - content            │   │
│  │  - onFilterChange    │      │  - type               │   │
│  │                      │      │  - hasChanges         │   │
│  └──────────────────────┘      │  - isSaving           │   │
│                                 └──────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ API Calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Endpoints                           │
│                                                              │
│  GET    /api/documents          - List documents            │
│  POST   /api/documents          - Create document           │
│  GET    /api/documents/:id      - Get document              │
│  PATCH  /api/documents/:id      - Update document           │
│  DELETE /api/documents/:id      - Delete document           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Use Cases                               │
│                                                              │
│  - CreateDocumentUseCase                                     │
│  - UpdateDocumentUseCase                                     │
│  - GetDocumentUseCase                                        │
│  - ListDocumentsUseCase                                      │
│  - SearchDocumentsUseCase                                    │
│  - DeleteDocumentUseCase                                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   DocumentRepository                         │
│                                                              │
│  - save(document)                                            │
│  - findById(id)                                              │
│  - findByWorkspaceId(workspaceId, options)                  │
│  - search(workspaceId, query, options)                      │
│  - delete(id)                                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Prisma / Database                       │
└─────────────────────────────────────────────────────────────┘
```

## Event Flow

### Creating a Document

```
User clicks "New Document"
    ↓
DocumentsPage.handleCreateNew()
    ↓
Set isCreating = true
Set selectedDocument = null
    ↓
DocumentEditor renders (empty state)
    ↓
User enters title and content
    ↓
User clicks Save or presses Cmd/Ctrl+S
    ↓
DocumentEditor.handleSave()
    ↓
DocumentsPage.handleSaveDocument()
    ↓
POST /api/documents
    ↓
CreateDocumentUseCase.execute()
    ↓
DocumentRepository.save()
    ↓
Document saved to database
    ↓
Response returned to page
    ↓
Update documents list
Set selectedDocument to new document
Set isCreating = false
```

### Editing a Document

```
User clicks document in list
    ↓
DocumentList.onSelectDocument()
    ↓
DocumentsPage.handleSelectDocument()
    ↓
Set selectedDocument
Set isCreating = false
    ↓
DocumentEditor renders with document data
    ↓
User modifies title or content
    ↓
hasChanges = true (tracked in editor)
    ↓
User clicks Save or presses Cmd/Ctrl+S
    ↓
DocumentEditor.handleSave()
    ↓
DocumentsPage.handleSaveDocument()
    ↓
PATCH /api/documents/:id
    ↓
UpdateDocumentUseCase.execute()
    ↓
DocumentRepository.save()
    ↓
Document updated in database
    ↓
Response returned to page
    ↓
Update document in list
Update selectedDocument
Set hasChanges = false
```

### Searching Documents

```
User types in search box
    ↓
DocumentList.onSearchChange()
    ↓
DocumentsPage.setSearchQuery()
    ↓
useEffect triggers (searchQuery dependency)
    ↓
DocumentsPage.loadDocuments()
    ↓
GET /api/documents?search=query
    ↓
SearchDocumentsUseCase.execute()
    ↓
DocumentRepository.search()
    ↓
Filtered documents returned
    ↓
Update documents list
```

### Filtering Documents

```
User clicks filter button
    ↓
DocumentList.onFilterChange()
    ↓
DocumentsPage.setFilterType()
    ↓
useEffect triggers (filterType dependency)
    ↓
DocumentsPage.loadDocuments()
    ↓
GET /api/documents?type=TEXT
    ↓
ListDocumentsUseCase.execute()
    ↓
DocumentRepository.findByWorkspaceId()
    ↓
Filtered documents returned
    ↓
Update documents list
```

### Deleting a Document

```
User clicks delete icon
    ↓
Browser confirmation dialog
    ↓
User confirms
    ↓
DocumentList.handleDelete()
    ↓
DocumentsPage.handleDeleteDocument()
    ↓
DELETE /api/documents/:id
    ↓
DeleteDocumentUseCase.execute()
    ↓
DocumentRepository.delete()
    ↓
Document removed from database
    ↓
Response returned to page
    ↓
Remove document from list
If selected, clear selectedDocument
```

## State Management Strategy

### Page-Level State

- **documents**: Master list of all documents
- **selectedDocument**: Currently selected document for editing
- **searchQuery**: Current search query string
- **filterType**: Current filter selection
- **isCreating**: Flag for new document creation mode
- **isLoading**: Loading state for API calls
- **error**: Error message for display

### Component-Level State (DocumentEditor)

- **title**: Current title value
- **content**: Current content value
- **type**: Current document type
- **hasChanges**: Tracks unsaved changes
- **isSaving**: Saving operation in progress
- **lastSaved**: Timestamp of last save
- **error**: Editor-specific errors

### Component-Level State (DocumentList)

- **deletingId**: ID of document being deleted (for loading state)

## Performance Considerations

1. **Efficient Re-renders**
   - Use React.memo for components if needed
   - Proper key usage in lists
   - Avoid unnecessary state updates

2. **API Optimization**
   - Debounced search (handled by API)
   - Pagination support (ready for implementation)
   - Caching strategies (future enhancement)

3. **User Experience**
   - Optimistic UI updates
   - Loading states for all async operations
   - Error boundaries for graceful failures

## Security Considerations

1. **Authentication**
   - All API calls require authentication
   - Session validation on server

2. **Authorization**
   - Workspace-scoped operations
   - User ownership validation
   - CRUD permission checks

3. **Input Validation**
   - Client-side validation for UX
   - Server-side validation for security
   - XSS prevention in content display

## Accessibility Features

1. **Keyboard Navigation**
   - Tab order follows logical flow
   - Keyboard shortcuts (Cmd/Ctrl+S)
   - Focus management

2. **Screen Readers**
   - Semantic HTML elements
   - ARIA labels where needed
   - Descriptive button text

3. **Visual Feedback**
   - Loading indicators
   - Error messages
   - Success confirmations
   - Unsaved changes warnings
