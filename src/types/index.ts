
export type SubmissionStatus = 'pending' | 'accepted' | 'acceptedWithConditions' | 'rejected';

export interface ProjectSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectTitle: string;
  projectDescription:string;
  files?: { name: string; size: number; type: string }[];
  submittedAt: string; // Store as ISO string, can be converted to Date object
  status: SubmissionStatus;
  acceptanceConditions?: string;
  rejectionReason?: string;
}

