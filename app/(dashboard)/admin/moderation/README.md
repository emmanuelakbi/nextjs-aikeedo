# Content Moderation

## Overview

The Content Moderation interface provides tools for administrators to review, flag, and moderate user-generated content. This fulfills **Requirement 6: Content Moderation** from the Admin Dashboard specification.

## Features

### Moderation Queue

**Location**: `/admin/moderation`

**Purpose**: Review AI-generated content for policy violations

**Capabilities**:
- View all generations in a paginated list
- Filter by content type (text, image, speech, transcription)
- Filter by status (pending, approved, flagged, removed)
- Search by user or workspace
- Sort by creation date
- Quick moderation actions

### Content Types

1. **Text Generations**
   - Chat messages
   - Text completions
   - Document content
   - Prompts and responses

2. **Image Generations**
   - AI-generated images
   - Image prompts
   - Image metadata

3. **Speech Generations**
   - Text-to-speech audio
   - Voice cloning samples
   - Audio transcripts

4. **Transcriptions**
   - Speech-to-text results
   - Audio file metadata

## Moderation Actions

### Flag Content

**Purpose**: Mark content as potentially violating policies

**Effects**:
- Content is marked as flagged
- Content remains visible to user (unless removed)
- Admin can add notes about the violation
- User is notified (optional)
- Action is logged in audit trail

**API Endpoint**: `POST /api/admin/moderation/flag`

**Body**:
```json
{
  "generationId": "gen-123",
  "reason": "Potentially inappropriate content",
  "action": "flag"
}
```

### Remove Content

**Purpose**: Hide content from the platform

**Effects**:
- Content is marked as removed
- Content is hidden from user
- User cannot access the content
- Credits may be refunded (optional)
- User is notified
- Action is logged in audit trail

**API Endpoint**: `POST /api/admin/moderation/flag`

**Body**:
```json
{
  "generationId": "gen-123",
  "reason": "Violates content policy - explicit content",
  "action": "remove"
}
```

### Ban User

**Purpose**: Suspend user account for policy violations

**Effects**:
- User account is suspended
- All active sessions are terminated
- User cannot log in
- User's content may be reviewed
- User is notified with reason
- Action is logged in audit trail

**API Endpoint**: `POST /api/admin/moderation/flag`

**Body**:
```json
{
  "generationId": "gen-123",
  "reason": "Repeated policy violations",
  "action": "ban_user"
}
```

### Approve Content

**Purpose**: Mark content as reviewed and acceptable

**Effects**:
- Content is marked as approved
- Content remains visible
- No further action needed
- Action is logged in audit trail

**Note**: This is typically done implicitly by not flagging content

## Moderation Queue

### Queue View

**Displayed Information**:
- Generation ID
- Content type badge
- User information (name, email)
- Workspace name
- Creation date
- Content preview (truncated)
- Status badge
- Action buttons

### Filtering Options

**By Type**:
- All types
- Text only
- Image only
- Speech only
- Transcription only

**By Status**:
- All statuses
- Pending review
- Approved
- Flagged
- Removed

**By Date**:
- Last 24 hours
- Last 7 days
- Last 30 days
- Custom date range

### Sorting Options

- Newest first (default)
- Oldest first
- Most reported
- By user

## Moderation Statistics

**Location**: `/admin/moderation` - Statistics section

**Metrics Displayed**:

1. **Overall Statistics**
   - Total content reviewed
   - Total flagged content
   - Total removed content
   - Total banned users

2. **Content Breakdown**
   - Flagged by type (text, image, speech, transcription)
   - Flagged by reason
   - Flagged by date

3. **Top Flagged Users**
   - User name and email
   - Number of violations
   - Last violation date
   - Account status

4. **Moderation Trends**
   - Flags over time
   - Removals over time
   - Bans over time

### API Endpoint

```
GET /api/admin/moderation/stats
```

**Query Parameters**:
- `days` (number): Number of days to include (default: 30)

**Response**:
```json
{
  "total": {
    "flagged": 150,
    "removed": 45,
    "banned": 5
  },
  "byType": {
    "text": 80,
    "image": 50,
    "speech": 15,
    "transcription": 5
  },
  "topUsers": [
    {
      "userId": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "violationCount": 8,
      "lastViolation": "2024-01-15T10:30:00Z",
      "status": "SUSPENDED"
    }
  ],
  "trends": {
    "daily": [
      {
        "date": "2024-01-15",
        "flagged": 12,
        "removed": 3,
        "banned": 1
      }
    ]
  }
}
```

## Content Policies

### Policy Categories

1. **Prohibited Content**
   - Illegal content
   - Explicit sexual content
   - Violence and gore
   - Hate speech
   - Harassment and bullying
   - Self-harm content

2. **Restricted Content**
   - Political content (context-dependent)
   - Medical advice
   - Financial advice
   - Legal advice
   - Copyrighted material

3. **Spam and Abuse**
   - Spam and advertising
   - Phishing attempts
   - Malware distribution
   - Platform manipulation

### Policy Enforcement

**First Violation**:
- Content is flagged
- User receives warning
- Content may be removed

**Second Violation**:
- Content is removed
- User receives final warning
- Account may be temporarily suspended

**Third Violation**:
- Account is permanently suspended
- All content is reviewed
- User is banned from platform

**Severe Violations**:
- Immediate account suspension
- Content is removed
- Law enforcement may be notified

## API Endpoints

### Get Moderation Queue

```
GET /api/admin/moderation/queue
```

**Query Parameters**:
- `type` (string): Filter by content type
- `status` (string): Filter by status
- `limit` (number): Results per page (default: 50)
- `offset` (number): Pagination offset

**Response**:
```json
{
  "items": [
    {
      "id": "gen-123",
      "type": "text",
      "status": "completed",
      "prompt": "Generate a story about...",
      "output": "Once upon a time...",
      "user": {
        "id": "user-123",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "workspace": {
        "id": "workspace-123",
        "name": "My Workspace"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 500,
    "hasMore": true
  }
}
```

### Flag Content

```
POST /api/admin/moderation/flag
```

**Body**:
```json
{
  "generationId": "gen-123",
  "reason": "Violates content policy",
  "action": "flag" | "remove" | "ban_user"
}
```

**Response**:
```json
{
  "success": true,
  "action": "remove",
  "generationId": "gen-123",
  "message": "Content has been removed"
}
```

### Get Moderation Statistics

```
GET /api/admin/moderation/stats
```

**Query Parameters**:
- `days` (number): Number of days to include

**Response**: See [Moderation Statistics](#moderation-statistics) section

## Security Considerations

### Access Control
- Only admins can access moderation tools
- All endpoints protected by `requireAdmin()` middleware
- Moderation actions require admin role

### Audit Logging
All moderation actions are logged:
- Content flagging (with reason)
- Content removal (with reason)
- User bans (with reason)
- Moderation queue viewing

### Data Privacy
- Flagged content is preserved for review
- Removed content is soft-deleted (not permanently deleted)
- User data is handled according to privacy policies
- Comply with GDPR and data retention requirements

### Legal Compliance
- Illegal content is reported to authorities
- CSAM (Child Sexual Abuse Material) is immediately reported
- Platform cooperates with law enforcement
- Legal holds are respected

## Usage Examples

### Review Flagged Content

1. Navigate to `/admin/moderation`
2. Filter by "Flagged" status
3. Review content in queue
4. For each item:
   - Read the content
   - Check user history
   - Determine if it violates policy
   - Take appropriate action (approve, remove, ban)

### Handle User Report

1. User reports inappropriate content
2. Navigate to moderation queue
3. Search for the generation ID
4. Review the content
5. If violation confirmed:
   - Flag or remove content
   - Notify user
   - Document reason
6. If no violation:
   - Mark as reviewed
   - No action needed

### Ban Repeat Offender

1. Navigate to moderation statistics
2. Review "Top Flagged Users"
3. Find user with multiple violations
4. Click on user to view history
5. Review all flagged content
6. If pattern of violations:
   - Select "Ban User" action
   - Enter reason
   - Confirm ban
7. User account is suspended

### Monitor Moderation Trends

1. Navigate to `/admin/moderation`
2. Scroll to Statistics section
3. Review trends over time
4. Look for:
   - Spikes in violations
   - Patterns by content type
   - Repeat offenders
5. Adjust policies or enforcement as needed

## Performance Considerations

- Moderation queue is paginated for performance
- Content previews are truncated
- Full content loaded on demand
- Statistics are cached (5 minutes)
- Consider background jobs for automated moderation

## Automated Moderation

### AI-Powered Moderation (Future)

Potential automated moderation features:
- Text content analysis for policy violations
- Image content analysis (NSFW detection)
- Spam detection
- Hate speech detection
- Automatic flagging for review

### Current Implementation

- Manual review by administrators
- User reporting system
- Pattern detection for repeat offenders
- Statistics for trend analysis

## Testing

```bash
# Run moderation tests
npm test src/app/api/admin/moderation
```

**Test Coverage**:
- Moderation queue retrieval
- Content flagging
- Content removal
- User banning
- Statistics calculation
- Error handling

## Related Documentation

- [Admin Dashboard Overview](../README.md)
- [Admin API Documentation](../../../../src/app/api/admin/README.md)
- [User Management](../users/README.md)
- [Audit Logging](../audit-logs/README.md)
- [Content Policies](../../../../docs/CONTENT_POLICIES.md) (if exists)
