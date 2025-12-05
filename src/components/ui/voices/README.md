# Voice Management UI Components

This directory contains UI components for managing voice cloning and voice library features.

## Components

### VoiceList

A list component that displays all voices with search and filter capabilities.

**Features:**

- Search voices by name or description
- Filter by status (All, Ready, Training, Failed)
- Status badges with visual indicators
- Delete voice functionality
- Empty state handling

**Props:**

```typescript
interface VoiceListProps {
  voices: Voice[];
  selectedVoiceId: string | null;
  onSelectVoice: (voice: Voice) => void;
  onDeleteVoice: (voiceId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: 'TRAINING' | 'READY' | 'FAILED' | 'ALL';
  onFilterChange: (status: 'TRAINING' | 'READY' | 'FAILED' | 'ALL') => void;
}
```

**Usage:**

```tsx
import { VoiceList } from '@/components/ui/voices';

<VoiceList
  voices={voices}
  selectedVoiceId={selectedVoice?.id || null}
  onSelectVoice={setSelectedVoice}
  onDeleteVoice={handleDeleteVoice}
  searchQuery={searchQuery}
  onSearchChange={setSearchQuery}
  filterStatus={filterStatus}
  onFilterChange={setFilterStatus}
/>;
```

### VoiceUploadForm

A form component for uploading voice samples and creating new voices.

**Features:**

- File upload with drag-and-drop support
- File type validation (audio files only)
- File size validation (max 10MB)
- Upload progress indicator
- Form validation
- Error handling

**Props:**

```typescript
interface VoiceUploadFormProps {
  onSubmit: (data: {
    name: string;
    description: string;
    sampleFileId: string;
  }) => Promise<void>;
  onCancel: () => void;
  onFileUpload: (file: File) => Promise<string>;
}
```

**Usage:**

```tsx
import { VoiceUploadForm } from '@/components/ui/voices';

<VoiceUploadForm
  onSubmit={handleCreateVoice}
  onCancel={() => setShowUploadForm(false)}
  onFileUpload={handleFileUpload}
/>;
```

### VoiceCard

A detailed card component for displaying voice information with audio playback.

**Features:**

- Voice metadata display
- Status indicators
- Audio playback controls
- Seek bar with time display
- Delete functionality
- Retry training for failed voices

**Props:**

```typescript
interface VoiceCardProps {
  voice: {
    id: string;
    name: string;
    description: string;
    status: 'TRAINING' | 'READY' | 'FAILED';
    sampleFileId: string;
    modelId: string | null;
    createdAt: Date;
  };
  sampleFileUrl?: string;
  onDelete?: (voiceId: string) => void;
  onRetry?: (voiceId: string) => void;
}
```

**Usage:**

```tsx
import { VoiceCard } from '@/components/ui/voices';

<VoiceCard
  voice={selectedVoice}
  sampleFileUrl={sampleUrl}
  onDelete={handleDeleteVoice}
  onRetry={handleRetryTraining}
/>;
```

## Voice Status Types

- **TRAINING**: Voice model is currently being trained
- **READY**: Voice is ready to use for speech synthesis
- **FAILED**: Voice training failed

## Integration Example

See `/app/(dashboard)/voices/page.tsx` for a complete integration example that demonstrates:

- Fetching voices from API
- Creating new voices
- Deleting voices
- Filtering and searching
- Audio playback

## Requirements

These components fulfill the following requirements:

- Content Management 4.1: Voice upload and creation
- Content Management 4.2: Voice training status tracking
- Content Management 4.3: Voice library management
- Content Management 4.4: Voice playback and preview
- Content Management 4.5: Voice usage limits (enforced at API level)

## Styling

Components use Tailwind CSS for styling and follow the existing design system:

- Blue primary color (#3B82F6)
- Gray neutral colors
- Consistent spacing and typography
- Responsive design
- Accessible color contrasts

## Accessibility

- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Focus indicators
- Screen reader friendly status messages
