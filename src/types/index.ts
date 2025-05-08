
export type SubmissionStatus = 'pending' | 'accepted' | 'acceptedWithConditions' | 'rejected';

export interface ProjectSubmissionFile {
  name: string;
  size: number;
  type: string;
  content: string; // Store as base64 data URI
}

export interface ProjectSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectTitle: string;
  projectDescription:string;
  files?: ProjectSubmissionFile[]; // Changed to an array of files
  submittedAt: string; // Store as ISO string, can be converted to Date object
  updatedAt?: string; // Optional: Store as ISO string for last update time
  status: SubmissionStatus;
  acceptanceConditions?: string;
  rejectionReason?: string;
}
