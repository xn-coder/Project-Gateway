import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const fileSchema = z
  .custom<File>(val => val instanceof File, 'Please upload a file.')
  .refine(file => file.size <= MAX_FILE_SIZE, `File size should be less than 5MB.`)
  .refine(file => ALLOWED_FILE_TYPES.includes(file.type), `Only .jpg, .jpeg, .png, .webp, .pdf, .doc, .docx, .txt files are allowed.`);

export const submissionSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional().refine(val => !val || /^[+]?[0-9\s-()]{7,20}$/.test(val), {
    message: "Please enter a valid phone number.",
  }),
  projectTitle: z.string().min(5, { message: "Project title must be at least 5 characters long." }),
  projectDescription: z.string().min(20, { message: "Project description must be at least 20 characters long." }).max(5000),
  files: z.array(fileSchema).optional().refine(files => !files || files.length <= 5, 'You can upload a maximum of 5 files.'),
});

export type SubmissionFormData = z.infer<typeof submissionSchema>;
