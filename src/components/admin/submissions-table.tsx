"use client";

import * as _React from 'react';
import type { ProjectSubmission } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Eye, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { deleteProject } from '@/app/actions';

interface SubmissionsTableProps {
  submissions: ProjectSubmission[];
  onDelete: (id: string) => Promise<void>; // Callback to refresh data after delete
}

export function SubmissionsTable({ submissions, onDelete }: SubmissionsTableProps) {
  const { toast } = useToast();
  const [isViewModalOpen, setIsViewModalOpen] = _React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = _React.useState(false);
  const [selectedSubmission, setSelectedSubmission] = _React.useState<ProjectSubmission | null>(null);
  const [submissionToDelete, setSubmissionToDelete] = _React.useState<ProjectSubmission | null>(null);

  const handleViewDetails = (submission: ProjectSubmission) => {
    setSelectedSubmission(submission);
    setIsViewModalOpen(true);
  };

  const handleDeleteConfirm = (submission: ProjectSubmission) => {
    setSubmissionToDelete(submission);
    setIsDeleteModalOpen(true);
  };
  
  const handleDelete = async () => {
    if (submissionToDelete) {
      const result = await deleteProject(submissionToDelete.id);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        await onDelete(submissionToDelete.id); // Trigger data refresh
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
      setIsDeleteModalOpen(false);
      setSubmissionToDelete(null);
    }
  };

  return (
    <>
      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Title</TableHead>
              <TableHead className="hidden md:table-cell">Client Name</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="hidden sm:table-cell">Submitted</TableHead>
              <TableHead className="text-center">Files</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No submissions yet.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div className="font-medium">{submission.projectTitle}</div>
                    <div className="text-xs text-muted-foreground md:hidden">{submission.name}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{submission.name}</TableCell>
                  <TableCell className="hidden lg:table-cell">{submission.email}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {format(parseISO(submission.submittedAt), 'PPp')}
                  </TableCell>
                  <TableCell className="text-center">
                    {submission.files && submission.files.length > 0 ? (
                       <Badge variant="secondary">{submission.files.length}</Badge>
                    ) : (
                       <Badge variant="outline">0</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewDetails(submission)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteConfirm(submission)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Details Modal */}
      <AlertDialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedSubmission?.projectTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              Submitted by {selectedSubmission?.name} on {selectedSubmission && format(parseISO(selectedSubmission.submittedAt), 'PPP \'at\' p')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div>
                <h4 className="font-semibold">Contact Information</h4>
                <p><strong>Email:</strong> {selectedSubmission.email}</p>
                {selectedSubmission.phone && <p><strong>Phone:</strong> {selectedSubmission.phone}</p>}
              </div>
              <div>
                <h4 className="font-semibold">Project Description</h4>
                <p className="whitespace-pre-wrap text-sm">{selectedSubmission.projectDescription}</p>
              </div>
              {selectedSubmission.files && selectedSubmission.files.length > 0 && (
                <div>
                  <h4 className="font-semibold">Attached Files ({selectedSubmission.files.length})</h4>
                  <ul className="list-none space-y-1 mt-1">
                    {selectedSubmission.files.map((file, index) => (
                      <li key={index} className="flex items-center text-sm p-2 border rounded-md bg-secondary/30">
                        <FileText className="h-4 w-4 mr-2 shrink-0 text-secondary-foreground" />
                        <span className="truncate" title={file.name}>{file.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the submission
              "{submissionToDelete?.projectTitle}" by {submissionToDelete?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
