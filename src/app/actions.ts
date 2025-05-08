
'use server';

import type { ProjectSubmission } from '@/types';
import { submissionSchema, type SubmissionFormData } from '@/lib/schemas';
import { db } from '@/lib/firebase/config'; // db is Firestore
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp as firestoreServerTimestamp,
  query,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';

// Helper to convert file to Base64 Data URI
const fileToDataURI = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


// Helper to convert Firestore document data to ProjectSubmission type
const fromFirestoreDoc = (id: string, data: DocumentData): ProjectSubmission | null => {
  if (!data) {
    return null;
  }
  return {
    id: id,
    name: data.name,
    email: data.email,
    phone: data.phone || undefined,
    projectTitle: data.projectTitle,
    projectDescription: data.projectDescription,
    file: data.file ? { 
      name: data.file.name, 
      size: data.file.size, 
      type: data.file.type, 
      content: data.file.content 
    } : undefined,
    submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate().toISOString() : (data.submittedAt || new Date().toISOString()),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
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
    // Construct a more detailed error message from Zod errors
    const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, message: `Invalid data: ${errorMessages}` };
  }

  try {
    const newSubmissionRef = doc(collection(db, 'submissions'));
    const submissionId = newSubmissionRef.id;

    let fileDataForFirestore: { name: string; size: number; type: string; content: string } | undefined = undefined;
    
    if (validationResult.data.file) {
      const file = validationResult.data.file;
      const fileContent = await fileToDataURI(file);
      fileDataForFirestore = {
        name: file.name,
        size: file.size,
        type: file.type,
        content: fileContent, // Base64 data URI
      };
    }

    const submissionDataForFirestore = {
      ...validationResult.data,
      file: fileDataForFirestore, // Store file metadata and content
      submittedAt: firestoreServerTimestamp(),
      status: 'pending',
    };

    await setDoc(newSubmissionRef, submissionDataForFirestore);

    console.log('New Submission ID (Firestore):', submissionId);
    console.log('Simulating email notification to owner about new submission...');
    console.log('Subject: New Project Submission - ' + submissionDataForFirestore.projectTitle);

    return { success: true, message: 'Project submitted successfully!', submissionId };
  } catch (error) {
    console.error('Error submitting project to Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to submit project: ${errorMessage}` };
  }
}

export async function getProjects(): Promise<ProjectSubmission[]> {
  try {
    const submissionsCollectionRef = collection(db, 'submissions');
    const q = query(submissionsCollectionRef, orderBy('submittedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const projects: ProjectSubmission[] = [];
    querySnapshot.forEach((docSnap) => {
      const project = fromFirestoreDoc(docSnap.id, docSnap.data());
      if (project) {
        projects.push(project);
      }
    });
    return projects;
  } catch (error) {
    console.error('Error fetching projects from Firestore:', error);
    return []; 
  }
}

export async function deleteProject(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const projectDocRef = doc(db, 'submissions', id);
    // No need to delete from Firebase Storage as files are in Firestore
    await deleteDoc(projectDocRef);
    console.log(`Deleted submission with ID from Firestore: ${id}`);
    return { success: true, message: 'Submission deleted successfully.' };
  } catch (error) {
    console.error(`Error deleting submission ${id} from Firestore:`, error);
    return { success: false, message: 'Failed to delete submission.' };
  }
}

async function updateProjectStatus(id: string, statusUpdate: Partial<ProjectSubmission>): Promise<{ success: boolean; message: string }> {
   try {
    const submissionDocRef = doc(db, 'submissions', id);
    const updates: DocumentData = { // Use DocumentData for updates
      ...statusUpdate,
      updatedAt: firestoreServerTimestamp(),
    };
     // Ensure 'file' is not accidentally set to undefined if not part of statusUpdate
    if (statusUpdate.file === undefined && 'file' in statusUpdate) {
        // This case should not happen with current status updates but is a safeguard
    } else if (statusUpdate.file) {
        updates.file = statusUpdate.file;
    }


    await updateDoc(submissionDocRef, updates);
    
    const docSnap = await getDoc(submissionDocRef);
    if (docSnap.exists()) {
        const submissionData = fromFirestoreDoc(docSnap.id, docSnap.data());
        if (submissionData) {
            let emailMessage = `Your project "${submissionData.projectTitle}" status has been updated.`;
            if (submissionData.status === 'accepted') {
                emailMessage = `Your project "${submissionData.projectTitle}" has been accepted.`;
            } else if (submissionData.status === 'acceptedWithConditions' && submissionData.acceptanceConditions) {
                emailMessage = `Your project "${submissionData.projectTitle}" has been accepted with the following conditions: ${submissionData.acceptanceConditions}`;
            } else if (submissionData.status === 'rejected' && submissionData.rejectionReason) {
                emailMessage = `Your project "${submissionData.projectTitle}" has been rejected. Reason: ${submissionData.rejectionReason}`;
            }
            console.log(`Simulating email to client ${submissionData.email}: ${emailMessage}`);
        }
    }
    return { success: true, message: `Project ${statusUpdate.status || 'status'} updated successfully.` };
  } catch (error) {
    console.error(`Error updating project ${id} in Firestore:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to update project status: ${errorMessage}` };
  }
}


export async function acceptProject(id: string): Promise<{ success: boolean; message: string }> {
  return updateProjectStatus(id, { 
    status: 'accepted', 
    acceptanceConditions: undefined, 
    rejectionReason: undefined 
  });
}

export async function acceptProjectWithConditions(id: string, conditions: string): Promise<{ success: boolean; message: string }> {
  if (!conditions || conditions.trim() === "") {
    return { success: false, message: 'Conditions cannot be empty.' };
  }
  return updateProjectStatus(id, { 
    status: 'acceptedWithConditions', 
    acceptanceConditions: conditions,
    rejectionReason: undefined 
  });
}

export async function rejectProject(id: string, reason: string): Promise<{ success: boolean; message: string }> {
  if (!reason || reason.trim() === "") {
    return { success: false, message: 'Reason cannot be empty.' };
  }
  return updateProjectStatus(id, { 
    status: 'rejected', 
    rejectionReason: reason,
    acceptanceConditions: undefined 
  });
}
