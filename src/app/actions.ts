
'use server';

import type { ProjectSubmission } from '@/types';
import { submissionSchema, type SubmissionFormData } from '@/lib/schemas';
import { rtdb, storage } from '@/lib/firebase/config'; // Updated to use rtdb and storage
import {
  ref,
  set,
  get,
  push,
  update,
  remove,
  serverTimestamp as rtdbServerTimestamp,
  query as rtdbQuery,
  orderByChild as rtdbOrderByChild,
  DataSnapshot,
} from 'firebase/database';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

// Helper to convert Realtime Database snapshot data to ProjectSubmission type
const fromRTDB = (id: string, data: any): ProjectSubmission | null => {
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
    // Convert RTDB timestamp (number) to ISO string or use existing ISO string
    submittedAt: typeof data.submittedAt === 'number' ? new Date(data.submittedAt).toISOString() : data.submittedAt || new Date().toISOString(),
    updatedAt: typeof data.updatedAt === 'number' ? new Date(data.updatedAt).toISOString() : data.updatedAt,
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
    const submissionsRef = ref(rtdb, 'submissions');
    const newSubmissionPushRef = push(submissionsRef); // Generates a unique key for the new submission
    const submissionId = newSubmissionPushRef.key;

    if (!submissionId) {
      throw new Error('Failed to generate a unique ID for the submission.');
    }

    const fileDataForRtdb: { name: string; size: number; type: string; url: string }[] = [];
    if (validationResult.data.files && validationResult.data.files.length > 0) {
      for (const file of validationResult.data.files) {
        // Create a unique path for each file in Storage: submissions/{submissionId}/{fileName}
        const fileStoragePath = `submissions/${submissionId}/${Date.now()}_${file.name}`;
        const sRef = storageRef(storage, fileStoragePath);
        
        // Upload file (assuming 'file' is a File object)
        const uploadResult = await uploadBytes(sRef, file);
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        
        fileDataForRtdb.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: downloadUrl,
        });
      }
    }

    const submissionDataForRtdb = {
      ...validationResult.data,
      files: fileDataForRtdb, // Store file metadata including download URL
      submittedAt: rtdbServerTimestamp(), // Use RTDB server timestamp
      status: 'pending',
    };
    // Remove the original 'files' property from submissionDataForRtdb if it contained File objects
    delete (submissionDataForRtdb as any).files; 
    submissionDataForRtdb.files = fileDataForRtdb;


    await set(ref(rtdb, `submissions/${submissionId}`), submissionDataForRtdb);

    console.log('New Submission ID (RTDB):', submissionId);
    console.log('Simulating email notification to owner about new submission...');
    console.log('Subject: New Project Submission - ' + submissionDataForRtdb.projectTitle);

    return { success: true, message: 'Project submitted successfully!', submissionId };
  } catch (error) {
    console.error('Error submitting project to RTDB/Storage:', error);
    // Ensure error is an instance of Error to access message property safely
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to submit project: ${errorMessage}` };
  }
}

export async function getProjects(): Promise<ProjectSubmission[]> {
  try {
    const submissionsListRef = ref(rtdb, 'submissions');
    // Order by 'submittedAt' (RTDB stores timestamps as numbers, sorts numerically)
    // RTDB orderByChild sorts ascending by default. We reverse it client-side for descending.
    const q = rtdbQuery(submissionsListRef, rtdbOrderByChild('submittedAt'));
    const snapshot = await get(q);
    
    const projects: ProjectSubmission[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const id in data) {
        const project = fromRTDB(id, data[id]);
        if (project) {
          projects.push(project);
        }
      }
      // Reverse to get newest first, as RTDB sorts ascending
      return projects.reverse(); 
    }
    return projects;
  } catch (error) {
    console.error('Error fetching projects from RTDB:', error);
    return []; 
  }
}

export async function deleteProject(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const projectRef = ref(rtdb, `submissions/${id}`);
    const snapshot = await get(projectRef);

    if (snapshot.exists()) {
      const projectData = snapshot.val() as ProjectSubmission;
      // Delete associated files from Firebase Storage
      if (projectData.files && projectData.files.length > 0) {
        for (const file of projectData.files) {
          if (file.url) {
            // It's important that file.url is the actual gs:// path or full HTTPS URL that can be resolved by storageRef
            // For simplicity, if file.url is the download URL, we need to parse it or store storage path.
            // Assuming file.url can be used to derive storage reference (often the case with getDownloadURL results)
            try {
              // Firebase SDK's storageRef can take gs:// URLs or HTTPS download URLs
              const fileStorageRef = storageRef(storage, file.url);
              await deleteObject(fileStorageRef);
              console.log(`Deleted file from storage: ${file.name}`);
            } catch (storageError: any) {
              // Log error but continue, e.g., file might have been manually deleted
              if (storageError.code === 'storage/object-not-found') {
                  console.warn(`File not found in storage (may have been already deleted): ${file.name}`);
              } else {
                  console.error(`Error deleting file ${file.name} from storage:`, storageError);
                  // Optionally, you might want to stop the whole deletion process if a file can't be deleted
                  // For now, we log and continue with RTDB record deletion.
              }
            }
          }
        }
      }
    }

    await remove(projectRef);
    console.log(`Deleted submission with ID from RTDB: ${id}`);
    return { success: true, message: 'Submission deleted successfully.' };
  } catch (error) {
    console.error(`Error deleting submission ${id} from RTDB:`, error);
    return { success: false, message: 'Failed to delete submission.' };
  }
}

async function updateProjectStatus(id: string, statusUpdate: Partial<ProjectSubmission>): Promise<{ success: boolean; message: string }> {
   try {
    const submissionRef = ref(rtdb, `submissions/${id}`);
    const updates = {
      ...statusUpdate,
      updatedAt: rtdbServerTimestamp(),
    };
    await update(submissionRef, updates);
    
    // Simulate email
    const snapshot = await get(submissionRef);
    if (snapshot.exists()) {
        const submissionData = fromRTDB(id, snapshot.val());
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
    console.error(`Error updating project ${id} in RTDB:`, error);
    return { success: false, message: 'Failed to update project status.' };
  }
}


export async function acceptProject(id: string): Promise<{ success: boolean; message: string }> {
  return updateProjectStatus(id, { 
    status: 'accepted', 
    acceptanceConditions: undefined, // Clear previous conditions/reasons
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
    rejectionReason: undefined // Clear previous reason
  });
}

export async function rejectProject(id: string, reason: string): Promise<{ success: boolean; message: string }> {
  if (!reason || reason.trim() === "") {
    return { success: false, message: 'Reason cannot be empty.' };
  }
  return updateProjectStatus(id, { 
    status: 'rejected', 
    rejectionReason: reason,
    acceptanceConditions: undefined // Clear previous conditions
  });
}
