
"use client";

import * as _React from 'react';
import type { ProjectSubmission, SubmissionStatus } from '@/types';
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
import { MoreHorizontal, Trash2, Eye, FileText, CheckCircle, XCircle, AlertTriangle, ThumbsUp, Download } from 'lucide-react';
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
import { deleteProject, acceptProject, acceptProjectWithConditions, rejectProject } from '@/app/actions';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
// import { Input } from '@/components/ui/input'; // Not directly used now

interface SubmissionsTableProps {
  submissions: ProjectSubmission[];
  onActionSuccess: (id: string) => Promise<void>; 
}

const getStatusBadgeVariant = (status: SubmissionStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'accepted':
      return 'default'; 
    case 'acceptedWithConditions':
      return 'secondary'; 
    case 'rejected':
      return 'destructive';
    case 'pending':
    default:
      return 'outline';
  }
};

const formatStatusText = (status: SubmissionStatus): string => {
  switch (status) {
    case 'accepted':
      return 'Accepted';
    case 'acceptedWithConditions':
      return 'Accepted (Conditional)';
    case 'rejected':
      return 'Rejected';
    case 'pending':
    default:
      return 'Pending';
  }
};


export function SubmissionsTable({ submissions, onActionSuccess }: SubmissionsTableProps) {
  const { toast } = useToast();
  const [isViewModalOpen, setIsViewModalOpen] = _React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = _React.useState(false);
  const [isAcceptWithConditionsModalOpen, setIsAcceptWithConditionsModalOpen] = _React.useState(false);
  const [isRejectWithReasonModalOpen, setIsRejectWithReasonModalOpen] = _React.useState(false);
  
  const [selectedSubmission, setSelectedSubmission] = _React.useState<ProjectSubmission | null>(null);
  const [submissionForAction, setSubmissionForAction] = _React.useState<ProjectSubmission | null>(null);

  const [conditions, setConditions] = _React.useState('');
  const [reason, setReason] = _React.useState('');
  const [isProcessing, setIsProcessing] = _React.useState(false);


  const handleViewDetails = (submission: ProjectSubmission) => {
    setSelectedSubmission(submission);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (submission: ProjectSubmission) => {
    setSubmissionForAction(submission);
    setIsDeleteModalOpen(true);
  };
  
  const handleDelete = async () => {
    if (submissionForAction) {
      setIsProcessing(true);
      const result = await deleteProject(submissionForAction.id);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        await onActionSuccess(submissionForAction.id); 
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
      setIsDeleteModalOpen(false);
      setSubmissionForAction(null);
      setIsProcessing(false);
    }
  };

  const handleAccept = async (submission: ProjectSubmission) => {
    setIsProcessing(true);
    const result = await acceptProject(submission.id);
     if (result.success) {
        toast({ title: 'Success', description: result.message });
        await onActionSuccess(submission.id);
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    setIsProcessing(false);
  };

  const openAcceptWithConditionsModal = (submission: ProjectSubmission) => {
    setSubmissionForAction(submission);
    setConditions(submission.acceptanceConditions || '');
    setIsAcceptWithConditionsModalOpen(true);
  };

  const handleConfirmAcceptWithConditions = async () => {
    if (submissionForAction && conditions.trim()) {
      setIsProcessing(true);
      const result = await acceptProjectWithConditions(submissionForAction.id, conditions);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        await onActionSuccess(submissionForAction.id);
        setIsAcceptWithConditionsModalOpen(false);
        setSubmissionForAction(null);
        setConditions('');
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
      setIsProcessing(false);
    } else if (!conditions.trim()) {
       toast({ title: 'Validation Error', description: 'Conditions cannot be empty.', variant: 'destructive' });
    }
  };

  const openRejectWithReasonModal = (submission: ProjectSubmission) => {
    setSubmissionForAction(submission);
    setReason(submission.rejectionReason || '');
    setIsRejectWithReasonModalOpen(true);
  };

  const handleConfirmRejectWithReason = async () => {
    if (submissionForAction && reason.trim()) {
      setIsProcessing(true);
      const result = await rejectProject(submissionForAction.id, reason);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        await onActionSuccess(submissionForAction.id);
        setIsRejectWithReasonModalOpen(false);
        setSubmissionForAction(null);
        setReason('');
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
      setIsProcessing(false);
    } else if (!reason.trim()) {
       toast({ title: 'Validation Error', description: 'Reason cannot be empty.', variant: 'destructive' });
    }
  };

  const handleDownloadFile = (fileData: { name: string; content: string; type: string }) => {
    const link = document.createElement('a');
    link.href = fileData.content; // Data URI
    link.download = fileData.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <TableHead className="text-center">File</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No submissions yet.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow 
                  key={submission.id} 
                  onClick={() => handleViewDetails(submission)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="font-medium">{submission.projectTitle}</div>
                    <div className="text-xs text-muted-foreground md:hidden">{submission.name}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{submission.name}</TableCell>
                  <TableCell className="hidden lg:table-cell">{submission.email}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {submission.submittedAt ? format(parseISO(submission.submittedAt), 'PPp') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    {submission.file ? (
                       <Badge variant="secondary">1</Badge>
                    ) : (
                       <Badge variant="outline">0</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(submission.status)} className={submission.status === 'acceptedWithConditions' ? 'bg-amber-500 text-white hover:bg-amber-600' : ''}>
                      {formatStatusText(submission.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}> {/* Stop propagation to prevent row click when interacting with dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isProcessing}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetails(submission); }}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {submission.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAccept(submission); }}>
                              <ThumbsUp className="mr-2 h-4 w-4" /> Accept
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openAcceptWithConditionsModal(submission); }}>
                              <AlertTriangle className="mr-2 h-4 w-4" /> Accept with Conditions
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openRejectWithReasonModal(submission); }}>
                              <XCircle className="mr-2 h-4 w-4" /> Reject with Reason
                            </DropdownMenuItem>
                          </>
                        )}
                         {(submission.status === 'accepted' || submission.status === 'acceptedWithConditions' || submission.status === 'rejected') && (
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); openRejectWithReasonModal(submission); }} 
                              className={submission.status === 'rejected' ? "text-destructive" : "text-amber-600 dark:text-amber-500"}
                            >
                                <XCircle className="mr-2 h-4 w-4" /> 
                                {submission.status === 'rejected' ? 'Update Rejection' : 'Re-evaluate / Reject'}
                            </DropdownMenuItem>
                         )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDeleteModal(submission); }} className="text-destructive">
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
              Submitted by {selectedSubmission?.name} on {selectedSubmission?.submittedAt && format(parseISO(selectedSubmission.submittedAt), 'PPP \'at\' p')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
               <div>
                <h4 className="font-semibold mb-1">Status</h4>
                <div><Badge variant={getStatusBadgeVariant(selectedSubmission.status)} className={selectedSubmission.status === 'acceptedWithConditions' ? 'bg-amber-500 text-white hover:bg-amber-600' : ''}>{formatStatusText(selectedSubmission.status)}</Badge></div>
                {selectedSubmission.status === 'acceptedWithConditions' && selectedSubmission.acceptanceConditions && (
                  <p className="text-sm mt-2"><strong>Conditions:</strong> {selectedSubmission.acceptanceConditions}</p>
                )}
                {selectedSubmission.status === 'rejected' && selectedSubmission.rejectionReason && (
                  <p className="text-sm mt-2"><strong>Reason for Rejection:</strong> {selectedSubmission.rejectionReason}</p>
                )}
              </div>
              <div>
                <h4 className="font-semibold">Contact Information</h4>
                <p><strong>Email:</strong> {selectedSubmission.email}</p>
                {selectedSubmission.phone && <p><strong>Phone:</strong> {selectedSubmission.phone}</p>}
              </div>
              <div>
                <h4 className="font-semibold">Project Description</h4>
                <p className="whitespace-pre-wrap text-sm">{selectedSubmission.projectDescription}</p>
              </div>
              {selectedSubmission.file && (
                <div>
                  <h4 className="font-semibold">Attached File</h4>
                  <div className="flex items-center justify-between text-sm p-2 border rounded-md bg-secondary/30 mt-1">
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <FileText className="h-4 w-4 shrink-0 text-secondary-foreground" />
                      <span className="truncate" title={selectedSubmission.file.name}>{selectedSubmission.file.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">({(selectedSubmission.file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => selectedSubmission.file && handleDownloadFile(selectedSubmission.file)}
                        className="ml-2"
                        title={`Download ${selectedSubmission.file.name}`}
                    >
                        <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                  </div>
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
              "{submissionForAction?.projectTitle}" by {submissionForAction?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accept with Conditions Modal */}
      <AlertDialog open={isAcceptWithConditionsModalOpen} onOpenChange={setIsAcceptWithConditionsModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept with Conditions</AlertDialogTitle>
            <AlertDialogDescription>
              Specify the conditions for accepting the project "{submissionForAction?.projectTitle}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="conditions">Conditions</Label>
            <Textarea 
              id="conditions" 
              value={conditions} 
              onChange={(e) => setConditions(e.target.value)} 
              placeholder="e.g., Budget approval required, timeline adjustment needed."
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} onClick={() => {setSubmissionForAction(null); setConditions('');}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAcceptWithConditions} disabled={isProcessing || !conditions.trim()}>
              {isProcessing ? 'Accepting...' : 'Accept with Conditions'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject with Reason Modal */}
      <AlertDialog open={isRejectWithReasonModalOpen} onOpenChange={setIsRejectWithReasonModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject with Reason</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason for rejecting the project "{submissionForAction?.projectTitle}".
            </AlertDialogDescription>
          </AlertDialogHeader>
           <div className="py-4 space-y-2">
            <Label htmlFor="reason">Reason for Rejection</Label>
            <Textarea 
              id="reason" 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              placeholder="e.g., Project scope too broad, budget mismatch."
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} onClick={() => {setSubmissionForAction(null); setReason('');}}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRejectWithReason} disabled={isProcessing || !reason.trim()} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
               {isProcessing ? 'Rejecting...' : 'Reject Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
