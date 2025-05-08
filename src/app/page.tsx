import { SubmissionForm } from '@/components/submission-form';
import { MainHeader } from '@/components/layout/main-header';

export default function HomePage() {
  return (
    <>
      <MainHeader />
      <main className="container mx-auto py-8 px-4">
        <SubmissionForm />
      </main>
    </>
  );
}
