
export type SubmissionStatus = 'pending' | 'accepted' | 'acceptedWithConditions' | 'rejected';

export interface ProjectSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectTitle: string;
  projectDescription:string;
  files?: { name: string; size: number; type: string; url: string }[]; // Added URL for storage link
  submittedAt: string; // Store as ISO string, can be converted to Date object
  updatedAt?: string; // Optional: Store as ISO string for last update time
  status: SubmissionStatus;
  acceptanceConditions?: string;
  rejectionReason?: string;
}
