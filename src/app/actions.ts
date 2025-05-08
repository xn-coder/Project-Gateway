
'use server';

import type { ProjectSubmission } from '@/types';
import { submissionSchema, type SubmissionFormData } from '@/lib/schemas';
import { db, storage } from '@/lib/firebase/config'; // db is Firestore
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
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

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
    files: data.files || [],
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
    return { success: false, message: 'Invalid data. Please check the form.' };
  }

  try {
    // Create a new document reference with an auto-generated ID in the "submissions" collection
    const newSubmissionRef = doc(collection(db, 'submissions'));
    const submissionId = newSubmissionRef.id;

    const fileDataForFirestore: { name: string; size: number; type: string; url: string }[] = [];
    if (validationResult.data.files && validationResult.data.files.length > 0) {
      for (const file of validationResult.data.files) {
        const fileStoragePath = `submissions/${submissionId}/${Date.now()}_${file.name}`;
        const sRef = storageRef(storage, fileStoragePath);
        
        const uploadResult = await uploadBytes(sRef, file);
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        
        fileDataForFirestore.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: downloadUrl,
        });
      }
    }

    const submissionDataForFirestore = {
      ...validationResult.data,
      files: fileDataForFirestore, // Store file metadata including download URL
      submittedAt: firestoreServerTimestamp(), // Use Firestore server timestamp
      status: 'pending',
    };
    // Remove the original 'files' property if it contained File objects (it shouldn't at this point based on schema processing)
    // but as a safeguard:
    delete (submissionDataForFirestore as any).files; 
    submissionDataForFirestore.files = fileDataForFirestore;


    await setDoc(newSubmissionRef, submissionDataForFirestore);

    console.log('New Submission ID (Firestore):', submissionId);
    console.log('Simulating email notification to owner about new submission...');
    console.log('Subject: New Project Submission - ' + submissionDataForFirestore.projectTitle);

    return { success: true, message: 'Project submitted successfully!', submissionId };
  } catch (error) {
    console.error('Error submitting project to Firestore/Storage:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to submit project: ${errorMessage}` };
  }
}

export async function getProjects(): Promise<ProjectSubmission[]> {
  try {
    const submissionsCollectionRef = collection(db, 'submissions');
    // Order by 'submittedAt' in descending order (newest first)
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
    const docSnap = await getDoc(projectDocRef);

    if (docSnap.exists()) {
      const projectData = fromFirestoreDoc(docSnap.id, docSnap.data());
      if (projectData && projectData.files && projectData.files.length > 0) {
        for (const file of projectData.files) {
          if (file.url) {
            try {
              const fileStorageRef = storageRef(storage, file.url);
              await deleteObject(fileStorageRef);
              console.log(`Deleted file from storage: ${file.name}`);
            } catch (storageError: any) {
              if (storageError.code === 'storage/object-not-found') {
                  console.warn(`File not found in storage (may have been already deleted): ${file.name}`);
              } else {
                  console.error(`Error deleting file ${file.name} from storage:`, storageError);
              }
            }
          }
        }
      }
    }

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
    const updates = {
      ...statusUpdate,
      updatedAt: firestoreServerTimestamp(),
    };
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
    return { success: false, message: 'Failed to update project status.' };
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

