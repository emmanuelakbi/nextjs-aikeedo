/**
 * Voice Entity
 * Requirements: Content Management 4.1, 4.2, 4.3, 4.4, 4.5
 */

export type VoiceStatus = 'TRAINING' | 'READY' | 'FAILED';

export interface VoiceEntityProps {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  sampleFileId: string;
  modelId: string | null;
  status: VoiceStatus;
  createdAt: Date;
}

export class VoiceEntity {
  private props: VoiceEntityProps;

  constructor(props: VoiceEntityProps) {
    this.props = props;
  }

  getId(): string {
    return this.props.id;
  }

  getWorkspaceId(): string {
    return this.props.workspaceId;
  }

  getName(): string {
    return this.props.name;
  }

  getDescription(): string {
    return this.props.description;
  }

  getSampleFileId(): string {
    return this.props.sampleFileId;
  }

  getModelId(): string | null {
    return this.props.modelId;
  }

  getStatus(): VoiceStatus {
    return this.props.status;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Check if voice belongs to workspace
   */
  belongsToWorkspace(workspaceId: string): boolean {
    return this.props.workspaceId === workspaceId;
  }

  /**
   * Check if voice is ready for use
   */
  isReady(): boolean {
    return this.props.status === 'READY';
  }

  /**
   * Check if voice is training
   */
  isTraining(): boolean {
    return this.props.status === 'TRAINING';
  }

  /**
   * Check if voice training failed
   */
  hasFailed(): boolean {
    return this.props.status === 'FAILED';
  }

  /**
   * Mark voice as ready
   */
  markAsReady(modelId: string): void {
    this.props.status = 'READY';
    this.props.modelId = modelId;
  }

  /**
   * Mark voice as failed
   */
  markAsFailed(): void {
    this.props.status = 'FAILED';
  }

  toJSON(): VoiceEntityProps {
    return { ...this.props };
  }
}
