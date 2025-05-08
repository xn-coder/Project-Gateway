
'use server';

import type { ProjectSubmission, ProjectSubmissionFile, SubmissionStatus } from '@/types';
import { submissionSchema, type SubmissionFormData } from '@/lib/schemas';
import { db } from '@/lib/firebase/config'; // db is Firestore
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp as firestoreServerTimestamp,
  query,
  orderBy,
  Timestamp,
  DocumentData,
  deleteField, 
  FieldValue,
} from 'firebase/firestore';
import { 
  sendEmail,
  generateProjectSubmissionClientEmail,
  generateNewSubmissionAdminEmail,
  generateStatusUpdateEmail
} from '@/lib/email/nodemailer';

// Helper to convert Firestore document data to ProjectSubmission type
const fromFirestoreDoc = (id: string, data: DocumentData): ProjectSubmission | null => {
  if (!data) {
    return null;
  }
  return {
    id: id,
    name: data.name,
    email: data.email,
    phone: data.phone === null ? undefined : (data.phone || undefined), 
    projectTitle: data.projectTitle,
    projectDescription: data.projectDescription,
    files: data.files ? (data.files as Array<any>).map(file => ({ 
      name: file.name,
      size: file.size,
      type: file.type,
      content: file.content
    })) : undefined,
    submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate().toISOString() : (data.submittedAt || new Date().toISOString()),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    status: data.status,
    acceptanceConditions: data.acceptanceConditions === null ? undefined : (data.acceptanceConditions || undefined), 
    rejectionReason: data.rejectionReason === null ? undefined : (data.rejectionReason || undefined), 
  };
};


export async function submitProject(
  data: SubmissionFormData
): Promise<{ success: boolean; message: string; submissionId?: string }> {
  const validationResult = submissionSchema.safeParse(data);

  if (!validationResult.success) {
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
          content: fileContent, 
        };
      }));
    }

    const submissionDataForFirestore: Omit<ProjectSubmission, 'id' | 'submittedAt' | 'updatedAt' | 'status'> & { files?: ProjectSubmissionFile[], submittedAt?: FieldValue, status: 'pending' } = {
      name: validationResult.data.name,
      email: validationResult.data.email,
      projectTitle: validationResult.data.projectTitle,
      projectDescription: validationResult.data.projectDescription,
      ...(validationResult.data.phone && { phone: validationResult.data.phone }),
      ...(filesDataForFirestore && { files: filesDataForFirestore }),
      submittedAt: firestoreServerTimestamp(),
      status: 'pending',
    };

    await setDoc(newSubmissionRef, submissionDataForFirestore);
    console.log('New Submission ID (Firestore):', submissionId);
    
    // Send email notification to client
    const clientEmailContent = await generateProjectSubmissionClientEmail(
      submissionDataForFirestore.projectTitle,
      submissionDataForFirestore.name,
      submissionId
    );
    await sendEmail({
      to: submissionDataForFirestore.email,
      subject: clientEmailContent.subject,
      html: clientEmailContent.html,
      text: clientEmailContent.text,
    });

    // Send email notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"; // Use env var or fallback
    if (adminEmail) {
      const adminEmailContent = await generateNewSubmissionAdminEmail(
        submissionDataForFirestore.projectTitle,
        submissionDataForFirestore.name,
        submissionDataForFirestore.email,
        submissionId
      );
      await sendEmail({
        to: adminEmail,
        subject: adminEmailContent.subject,
        html: adminEmailContent.html,
        text: adminEmailContent.text,
      });
    } else {
      console.warn("ADMIN_EMAIL not set, skipping admin notification.");
    }

    return { success: true, message: 'Project submitted successfully! You will receive a confirmation email shortly.', submissionId };
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
    await deleteDoc(projectDocRef);
    console.log(`Deleted submission with ID from Firestore: ${id}`);
    return { success: true, message: 'Submission deleted successfully.' };
  } catch (error) {
    console.error(`Error deleting submission ${id} from Firestore:`, error);
    return { success: false, message: 'Failed to delete submission.' };
  }
}

type ProjectStatusUpdateData = Partial<Omit<ProjectSubmission, 'id' | 'submittedAt' | 'updatedAt' | 'status'>> & {
  status?: SubmissionStatus; 
  acceptanceConditions?: string | FieldValue;
  rejectionReason?: string | FieldValue;
};


async function updateProjectStatus(id: string, statusUpdate: ProjectStatusUpdateData): Promise<{ success: boolean; message: string }> {
   try {
    const submissionDocRef = doc(db, 'submissions', id);
    
    const updatesToApply: DocumentData = {};
    for (const key in statusUpdate) {
      if (Object.prototype.hasOwnProperty.call(statusUpdate, key)) {
        const typedKey = key as keyof ProjectStatusUpdateData;
        if (statusUpdate[typedKey] !== undefined) {
          updatesToApply[typedKey] = statusUpdate[typedKey];
        }
      }
    }
    updatesToApply.updatedAt = firestoreServerTimestamp();

    await updateDoc(submissionDocRef, updatesToApply);
    
    const docSnap = await getDoc(submissionDocRef);
    if (docSnap.exists()) {
        const submissionData = fromFirestoreDoc(docSnap.id, docSnap.data());
        if (submissionData && submissionData.status) { // Ensure status is defined
            let emailDetails: string | undefined;
            if (submissionData.status === 'acceptedWithConditions') {
              emailDetails = submissionData.acceptanceConditions;
            } else if (submissionData.status === 'rejected') {
              emailDetails = submissionData.rejectionReason;
            }

            // Only send email if it's a client-facing status update
            if (submissionData.status === 'accepted' || submissionData.status === 'acceptedWithConditions' || submissionData.status === 'rejected') {
              const emailContent = await generateStatusUpdateEmail(
                submissionData.projectTitle,
                submissionData.name,
                submissionData.status,
                emailDetails
              );
              await sendEmail({
                to: submissionData.email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
              });
            }
        }
    }
    return { success: true, message: `Project ${statusUpdate.status || 'status'} updated successfully. Client notified.` };
  } catch (error) {
    console.error(`Error updating project ${id} in Firestore:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Failed to update project status: ${errorMessage}` };
  }
}


export async function acceptProject(id: string): Promise<{ success: boolean; message: string }> {
  return updateProjectStatus(id, { 
    status: 'accepted', 
    acceptanceConditions: deleteField(), 
    rejectionReason: deleteField()     
  });
}

export async function acceptProjectWithConditions(id: string, conditions: string): Promise<{ success: boolean; message: string }> {
  if (!conditions || conditions.trim() === "") {
    return { success: false, message: 'Conditions cannot be empty.' };
  }
  return updateProjectStatus(id, { 
    status: 'acceptedWithConditions', 
    acceptanceConditions: conditions,
    rejectionReason: deleteField() 
  });
}

export async function rejectProject(id: string, reason: string): Promise<{ success: boolean; message: string }> {
  if (!reason || reason.trim() === "") {
    return { success: false, message: 'Reason cannot be empty.' };
  }
  return updateProjectStatus(id, { 
    status: 'rejected', 
    rejectionReason: reason,
    acceptanceConditions: deleteField() 
  });
}

