
"use client";

import * as _React from 'react';
import { getProjects } from '@/app/actions';
import type { ProjectSubmission } from '@/types';
import { SubmissionsTable } from '@/components/admin/submissions-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PackageOpen, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SortKey = 'submittedAt' | 'projectTitle' | 'name' | 'status';
type SortOrder = 'asc' | 'desc';

export default function AdminDashboardPage() {
  const [submissions, setSubmissions] = _React.useState<ProjectSubmission[]>([]);
  const [isLoading, setIsLoading] = _React.useState(true);
  const [error, setError] = _React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = _React.useState('');
  const [sortKey, setSortKey] = _React.useState<SortKey>('submittedAt');
  const [sortOrder, setSortOrder] = _React.useState<SortOrder>('desc');

  const fetchSubmissions = _React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setSubmissions(data);
    } catch (err) {
      setError('Failed to load submissions.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  _React.useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);
  
  const handleRefresh = () => {
    fetchSubmissions();
  };

  const handleActionSuccess = async (id: string) => {
    // This function is called by SubmissionsTable after a successful action
    // to refresh the list. It refetches all submissions.
    // The 'id' parameter is available if specific row refresh logic is needed later.
    await fetchSubmissions();
  };

  const filteredAndSortedSubmissions = _React.useMemo(() => {
    let filtered = submissions;

    if (searchTerm) {
      filtered = submissions.filter(
        (s) =>
          s.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return [...filtered].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'submittedAt') {
         valA = new Date(a.submittedAt).getTime();
         valB = new Date(b.submittedAt).getTime();
      } else if (sortKey === 'projectTitle' || sortKey === 'name' || sortKey === 'status') {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }


      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return sortOrder === 'desc' ? comparison * -1 : comparison;
    });
  }, [submissions, searchTerm, sortKey, sortOrder]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-destructive">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Submissions</h1>
            <p className="text-muted-foreground">View and manage all incoming project requests.</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" /> Refresh Data
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
             <Input
                placeholder="Search by title, name, email or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            <div className="flex gap-2 items-center w-full md:w-auto">
              <Select
                value={sortKey}
                onValueChange={(value) => setSortKey(value as SortKey)}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submittedAt">Date Submitted</SelectItem>
                  <SelectItem value="projectTitle">Project Title</SelectItem>
                  <SelectItem value="name">Client Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as SortOrder)}
              >
                <SelectTrigger className="w-full md:w-[120px]">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedSubmissions.length > 0 ? (
            <SubmissionsTable submissions={filteredAndSortedSubmissions} onActionSuccess={handleActionSuccess} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <PackageOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">No Submissions Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search or filter criteria." : "There are no project submissions yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
