/**
 * File Entity
 * Requirements: Content Management 1.1, 1.2, 1.3, 1.4
 */

export interface FileEntityProps {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storageKey: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export class FileEntity {
  private props: FileEntityProps;

  constructor(props: FileEntityProps) {
    this.props = props;
  }

  getId(): string {
    return this.props.id;
  }

  getWorkspaceId(): string {
    return this.props.workspaceId;
  }

  getUserId(): string {
    return this.props.userId;
  }

  getName(): string {
    return this.props.name;
  }

  getType(): string {
    return this.props.type;
  }

  getSize(): number {
    return this.props.size;
  }

  getUrl(): string {
    return this.props.url;
  }

  getStorageKey(): string {
    return this.props.storageKey;
  }

  getMetadata(): Record<string, unknown> {
    return this.props.metadata;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Check if file belongs to user
   */
  belongsToUser(userId: string): boolean {
    return this.props.userId === userId;
  }

  /**
   * Check if file belongs to workspace
   */
  belongsToWorkspace(workspaceId: string): boolean {
    return this.props.workspaceId === workspaceId;
  }

  /**
   * Get file extension
   */
  getExtension(): string {
    const parts = this.props.name.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }

  /**
   * Check if file is an image
   */
  isImage(): boolean {
    const imageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];
    return imageTypes.includes(this.props.type);
  }

  /**
   * Check if file is audio
   */
  isAudio(): boolean {
    const audioTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/flac',
    ];
    return audioTypes.includes(this.props.type);
  }

  /**
   * Check if file is a document
   */
  isDocument(): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
    ];
    return documentTypes.includes(this.props.type);
  }

  toJSON(): FileEntityProps {
    return { ...this.props };
  }
}
