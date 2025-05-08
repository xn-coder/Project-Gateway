'use server';

import type { ProjectSubmission } from '@/types';
import { submissionSchema, type SubmissionFormData } from '@/lib/schemas';

// In-memory store for submissions (replace with a database in a real app)
let submissions: ProjectSubmission[] = [
  {
    id: '1',
    name: 'Alice Wonderland',
    email: 'alice@example.com',
    projectTitle: 'E-commerce Platform Redesign',
    projectDescription: 'Looking to redesign our existing e-commerce platform for better user experience and mobile responsiveness. Key features include improved search, streamlined checkout, and new product showcase pages.',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    files: [{ name: 'brief.pdf', size: 1024*200, type: 'application/pdf' }],
    status: 'pending',
  },
  {
    id: '2',
    name: 'Bob The Builder',
    email: 'bob@example.com',
    phone: '+1234567890',
    projectTitle: 'Mobile App Development',
    projectDescription: 'Need a cross-platform mobile app for task management. Should have features like task creation, assignment, deadlines, and notifications. We have detailed mockups ready.',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    status: 'pending',
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    projectTitle: 'Content Management System',
    projectDescription: 'We require a custom CMS for our blog. Needs to be SEO friendly and allow multiple authors with different roles. Integration with social media is also important.',
    submittedAt: new Date().toISOString(),
    files: [{ name: 'requirements.docx', size: 1024*50, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }, {name: 'logo-draft.png', size: 1024*150, type: 'image/png'}],
    status: 'pending',
  }
];

export async function submitProject(
  data: SubmissionFormData
): Promise<{ success: boolean; message: string; submissionId?: string }> {
  const validationResult = submissionSchema.safeParse(data);

  if (!validationResult.success) {
    // Simplified error message. In a real app, you might return detailed errors.
    return { success: false, message: 'Invalid data. Please check the form.' };
  }

  const newSubmission: ProjectSubmission = {
    id: Date.now().toString(), // Simple ID generation
    ...validationResult.data,
    files: data.files?.map(file => ({ name: file.name, size: file.size, type: file.type })), // Store file metadata
    submittedAt: new Date().toISOString(),
    status: 'pending', // New submissions are pending by default
  };

  // Simulate saving to database
  submissions.unshift(newSubmission); // Add to the beginning of the array

  console.log('New Submission:', newSubmission);
  console.log('Simulating email notification to owner about new submission...');
  console.log('Subject: New Project Submission - ' + newSubmission.projectTitle);
  console.log('From: ' + newSubmission.name + ' <' + newSubmission.email + '>');
  console.log('Phone: ' + (newSubmission.phone || 'N/A'));
  console.log('Description: ' + newSubmission.projectDescription);
  if (newSubmission.files && newSubmission.files.length > 0) {
    console.log('Files: ' + newSubmission.files.map(f => `${f.name} (${(f.size / 1024).toFixed(2)} KB)`).join(', '));
  }
  console.log('Submitted At: ' + new Date(newSubmission.submittedAt).toLocaleString());


  // Simulate file handling (e.g., upload to cloud storage)
  if (data.files && data.files.length > 0) {
    console.log(`Simulating upload for ${data.files.length} file(s):`);
    data.files.forEach(file => {
      console.log(` - ${file.name} (${file.type}, ${file.size} bytes)`);
    });
  }


  return { success: true, message: 'Project submitted successfully!', submissionId: newSubmission.id };
}

export async function getProjects(): Promise<ProjectSubmission[]> {
  // Simulate fetching from database
  return Promise.resolve(submissions.map(s => ({...s}))); // Return copies
}

export async function deleteProject(id: string): Promise<{ success: boolean; message: string }> {
  const initialLength = submissions.length;
  submissions = submissions.filter(submission => submission.id !== id);
  
  if (submissions.length < initialLength) {
    console.log(`Deleted submission with ID: ${id}`);
    return { success: true, message: 'Submission deleted successfully.' };
  } else {
    console.log(`Failed to delete submission with ID: ${id}. Not found.`);
    return { success: false, message: 'Submission not found.' };
  }
}

export async function acceptProject(id: string): Promise<{ success: boolean; message: string }> {
  const submission = submissions.find(s => s.id === id);
  if (!submission) {
    return { success: false, message: 'Submission not found.' };
  }
  submission.status = 'accepted';
  submission.acceptanceConditions = undefined;
  submission.rejectionReason = undefined;
  
  console.log(`Simulating email to client ${submission.email}: Your project "${submission.projectTitle}" has been accepted.`);
  return { success: true, message: 'Project accepted successfully.' };
}

export async function acceptProjectWithConditions(id: string, conditions: string): Promise<{ success: boolean; message: string }> {
  if (!conditions || conditions.trim() === "") {
    return { success: false, message: 'Conditions cannot be empty.' };
  }
  const submission = submissions.find(s => s.id === id);
  if (!submission) {
    return { success: false, message: 'Submission not found.' };
  }
  submission.status = 'acceptedWithConditions';
  submission.acceptanceConditions = conditions;
  submission.rejectionReason = undefined;

  console.log(`Simulating email to client ${submission.email}: Your project "${submission.projectTitle}" has been accepted with the following conditions: ${conditions}`);
  return { success: true, message: 'Project accepted with conditions successfully.' };
}

export async function rejectProject(id: string, reason: string): Promise<{ success: boolean; message: string }> {
  if (!reason || reason.trim() === "") {
    return { success: false, message: 'Reason cannot be empty.' };
  }
  const submission = submissions.find(s => s.id === id);
  if (!submission) {
    return { success: false, message: 'Submission not found.' };
  }
  submission.status = 'rejected';
  submission.rejectionReason = reason;
  submission.acceptanceConditions = undefined;

  console.log(`Simulating email to client ${submission.email}: Your project "${submission.projectTitle}" has been rejected. Reason: ${reason}`);
  return { success: true, message: 'Project rejected successfully.' };
}
