
"use client";

import { useState, type ChangeEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { submissionSchema, type SubmissionFormData } from '@/lib/schemas';
import { submitProject } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, FileText, XCircle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export function SubmissionForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      projectTitle: '',
      projectDescription: '',
      file: undefined, // Changed from files: []
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]; // Take the first file
      setSelectedFile(file);
      form.setValue('file', file, { shouldValidate: true });
    } else {
      // If no file is selected (e.g., user cancels file dialog), clear existing selection
      setSelectedFile(null);
      form.setValue('file', undefined, { shouldValidate: true });
    }
     // Reset the input value to allow re-selecting the same file after removing it
    event.target.value = '';
  };

  const removeFile = () => {
    setSelectedFile(null);
    form.setValue('file', undefined, { shouldValidate: true });
  };

  async function onSubmit(data: SubmissionFormData) {
    setIsSubmitting(true);
    try {
      // Ensure 'file' is undefined if null, not passed as null to the action
      const dataToSubmit = {
        ...data,
        file: data.file || undefined,
      };
      const result = await submitProject(dataToSubmit);
      if (result.success) {
        toast({
          title: 'Submission Successful!',
          description: result.message,
        });
        form.reset();
        setSelectedFile(null);
      } else {
        toast({
          title: 'Submission Failed',
          description: result.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while submitting the form.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Submit Your Project</CardTitle>
        <CardDescription className="text-center">
          Fill out the form below to tell us about your project requirements.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g. jane.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="e.g. +1 234 567 8900" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. New E-commerce Website" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your project in detail..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Please provide as much detail as possible. Max 5000 characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file" // Changed from 'files'
              render={() => ( // field prop is not directly used here for file input
                <FormItem>
                  <FormLabel>Supporting Document (Optional)</FormLabel>
                  <FormControl>
                    <div>
                      <Label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-input bg-background hover:bg-muted transition-colors"
                      >
                        <UploadCloud className="w-10 h-10 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          {selectedFile ? selectedFile.name : "Drag & drop a file here, or click to select"}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          Max 1 file, 200KB. PDF, DOCX, TXT, JPG, PNG.
                        </span>
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        // removed 'multiple' attribute
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  {selectedFile && (
                    <div className="mt-2">
                      <div
                        className="flex items-center justify-between p-2 border rounded-md bg-secondary/50"
                      >
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <FileText className="h-5 w-5 shrink-0 text-secondary-foreground" />
                          <span className="text-sm text-secondary-foreground truncate" title={selectedFile.name}>
                            {selectedFile.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={removeFile}
                        >
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Project'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
