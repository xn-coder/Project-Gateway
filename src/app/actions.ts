
'use server';

import type { ProjectSubmission, ProjectSubmissionFile } from '@/types';
import { submissionSchema, type SubmissionFormData } from '@/lib/schemas';
import { db } from '@/lib/firebase/config'; // db is Firestore
import {
  collection,
  doc,
  setDoc,
  // addDoc, // Not used
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
    files: data.files ? (data.files as Array<any>).map(file => ({ // Ensure files is treated as an array
      name: file.name,
      size: file.size,
      type: file.type,
      content: file.content
    })) : undefined,
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

    let filesDataForFirestore: ProjectSubmissionFile[] | undefined = undefined;
    
    if (validationResult.data.files && validationResult.data.files.length > 0) {
      filesDataForFirestore = await Promise.all(validationResult.data.files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileContent = `data:${file.type};base64,${buffer.toString('base64')}`;
        
        return {
          name: file.name,
          size: file.size,
          type: file.type,
          content: fileContent, // Base64 data URI
        };
      }));
    }

    const submissionDataForFirestore = {
      ...validationResult.data,
      files: filesDataForFirestore, // Store array of file metadata and content
      submittedAt: firestoreServerTimestamp(),
      status: 'pending',
    };
    // Remove the 'files' field from the top level if it was only for Zod schema and already processed into submissionDataForFirestore.files
    if ('file' in submissionDataForFirestore) {
        delete (submissionDataForFirestore as any).file; 
    }


    await setDoc(newSubmissionRef, submissionDataForFirestore);

    console.log('New Submission ID (Firestore):', submissionId);
    
    // Simulate email notification to client
    console.log(`Simulating email to client ${submissionDataForFirestore.email}: Your project "${submissionDataForFirestore.projectTitle}" has been successfully submitted. We will review it shortly.`);

    // Simulate email notification to admin
    const adminEmail = "admin@example.com"; // Placeholder for admin email
    console.log(`Simulating email to admin (${adminEmail}): New project submission received: "${submissionDataForFirestore.projectTitle}" by ${submissionDataForFirestore.name} (${submissionDataForFirestore.email}).`);


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
     // Ensure 'files' is not accidentally set to undefined if not part of statusUpdate
    if (statusUpdate.files === undefined && 'files' in statusUpdate) {
        // This case should not happen with current status updates but is a safeguard
    } else if (statusUpdate.files) {
        updates.files = statusUpdate.files;
    }


    await updateDoc(submissionDocRef, updates);
    
    const docSnap = await getDoc(submissionDocRef);
    if (docSnap.exists()) {
        const submissionData = fromFirestoreDoc(docSnap.id, docSnap.data());
        if (submissionData) {
            let emailSubject = `Update on your project: "${submissionData.projectTitle}"`;
            let emailMessageBody = `The status of your project "${submissionData.projectTitle}" has been updated to ${submissionData.status}.`;

            if (submissionData.status === 'accepted') {
                emailSubject = `Congratulations! Your project "${submissionData.projectTitle}" has been accepted!`;
                emailMessageBody = `We are pleased to inform you that your project "${submissionData.projectTitle}" has been accepted. We will be in touch shortly with the next steps.`;
            } else if (submissionData.status === 'acceptedWithConditions' && submissionData.acceptanceConditions) {
                emailSubject = `Your project "${submissionData.projectTitle}" has been accepted with conditions`;
                emailMessageBody = `Your project "${submissionData.projectTitle}" has been accepted with the following conditions: "${submissionData.acceptanceConditions}". Please review these conditions. We will contact you to discuss them further.`;
            } else if (submissionData.status === 'rejected' && submissionData.rejectionReason) {
                emailSubject = `Update on your project submission: "${submissionData.projectTitle}"`;
                emailMessageBody = `We regret to inform you that after careful consideration, your project "${submissionData.projectTitle}" has been rejected. Reason: "${submissionData.rejectionReason}". If you would like to discuss this further, please feel free to contact us.`;
            }
            console.log(`Simulating email to client ${submissionData.email}:`);
            console.log(`Subject: ${emailSubject}`);
            console.log(`Body: ${emailMessageBody}`);
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

