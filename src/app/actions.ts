'use server';

import type { ProjectSubmission } from '@/types';
import { submissionSchema, type SubmissionFormData } from '@/lib/schemas';
import { db } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

// Helper to convert Firestore document data to ProjectSubmission type
const fromFirestore = (docSnap: ReturnType<typeof getDoc<any>>): ProjectSubmission | null => {
  if (!docSnap.exists()) {
    return null;
  }
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    email: data.email,
    phone: data.phone || undefined,
    projectTitle: data.projectTitle,
    projectDescription: data.projectDescription,
    files: data.files || [],
    // Convert Firestore Timestamp to ISO string
    submittedAt: (data.submittedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
    status: data.status,
    acceptanceConditions: data.acceptanceConditions || undefined,
    rejectionReason: data.rejectionReason || undefined,
  };
};


export async function submitProject(
  data: SubmissionFormData
): Promise<{ success: boolean; message: string; submissionId?: string }> {
  const validationResult = submissionSchema.safeParse(data);

  if (!validationResult.success) {
    return { success: false, message: 'Invalid data. Please check the form.' };
  }

  try {
    const submissionData = {
      ...validationResult.data,
      files: data.files?.map(file => ({ name: file.name, size: file.size, type: file.type })) || [],
      submittedAt: serverTimestamp(), // Use server timestamp
      status: 'pending',
    };

    const docRef = await addDoc(collection(db, 'submissions'), submissionData);

    console.log('New Submission ID:', docRef.id);
    // Simulate email notification (can be replaced with actual email service)
    console.log('Simulating email notification to owner about new submission...');
    console.log('Subject: New Project Submission - ' + submissionData.projectTitle);
    // ... (rest of the email simulation logs)

    return { success: true, message: 'Project submitted successfully!', submissionId: docRef.id };
  } catch (error) {
    console.error('Error submitting project to Firestore:', error);
    return { success: false, message: 'Failed to submit project. Please try again.' };
  }
}

export async function getProjects(): Promise<ProjectSubmission[]> {
  try {
    const submissionsCollection = collection(db, 'submissions');
    // Order by 'submittedAt' in descending order (newest first)
    const q = query(submissionsCollection, orderBy('submittedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const projects = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        projectTitle: data.projectTitle,
        projectDescription: data.projectDescription,
        files: data.files || [],
        submittedAt: (data.submittedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        status: data.status,
        acceptanceConditions: data.acceptanceConditions || undefined,
        rejectionReason: data.rejectionReason || undefined,
      } as ProjectSubmission;
    });
    return projects;
  } catch (error) {
    console.error('Error fetching projects from Firestore:', error);
    return []; // Return empty array on error
  }
}

export async function deleteProject(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await deleteDoc(doc(db, 'submissions', id));
    console.log(`Deleted submission with ID: ${id}`);
    return { success: true, message: 'Submission deleted successfully.' };
  } catch (error) {
    console.error(`Error deleting submission ${id}:`, error);
    return { success: false, message: 'Failed to delete submission.' };
  }
}

export async function acceptProject(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const submissionRef = doc(db, 'submissions', id);
    await updateDoc(submissionRef, {
      status: 'accepted',
      acceptanceConditions: null, // Explicitly nullify if it was set
      rejectionReason: null,      // Explicitly nullify if it was set
      updatedAt: serverTimestamp(),
    });
    // Simulate email
    const submissionSnap = await getDoc(submissionRef);
    const submissionData = fromFirestore(submissionSnap);
    if (submissionData) {
        console.log(`Simulating email to client ${submissionData.email}: Your project "${submissionData.projectTitle}" has been accepted.`);
    }
    return { success: true, message: 'Project accepted successfully.' };
  } catch (error) {
    console.error(`Error accepting project ${id}:`, error);
    return { success: false, message: 'Failed to accept project.' };
  }
}

export async function acceptProjectWithConditions(id: string, conditions: string): Promise<{ success: boolean; message: string }> {
  if (!conditions || conditions.trim() === "") {
    return { success: false, message: 'Conditions cannot be empty.' };
  }
  try {
    const submissionRef = doc(db, 'submissions', id);
    await updateDoc(submissionRef, {
      status: 'acceptedWithConditions',
      acceptanceConditions: conditions,
      rejectionReason: null, // Explicitly nullify
      updatedAt: serverTimestamp(),
    });
    // Simulate email
    const submissionSnap = await getDoc(submissionRef);
    const submissionData = fromFirestore(submissionSnap);
    if (submissionData) {
     console.log(`Simulating email to client ${submissionData.email}: Your project "${submissionData.projectTitle}" has been accepted with the following conditions: ${conditions}`);
    }
    return { success: true, message: 'Project accepted with conditions successfully.' };
  } catch (error) {
    console.error(`Error accepting project ${id} with conditions:`, error);
    return { success: false, message: 'Failed to accept project with conditions.' };
  }
}

export async function rejectProject(id: string, reason: string): Promise<{ success: boolean; message: string }> {
  if (!reason || reason.trim() === "") {
    return { success: false, message: 'Reason cannot be empty.' };
  }
  try {
    const submissionRef = doc(db, 'submissions', id);
    await updateDoc(submissionRef, {
      status: 'rejected',
      rejectionReason: reason,
      acceptanceConditions: null, // Explicitly nullify
      updatedAt: serverTimestamp(),
    });
     // Simulate email
    const submissionSnap = await getDoc(submissionRef);
    const submissionData = fromFirestore(submissionSnap);
    if (submissionData) {
      console.log(`Simulating email to client ${submissionData.email}: Your project "${submissionData.projectTitle}" has been rejected. Reason: ${reason}`);
    }
    return { success: true, message: 'Project rejected successfully.' };
  } catch (error) {
    console.error(`Error rejecting project ${id}:`, error);
    return { success: false, message: 'Failed to reject project.' };
  }
}
