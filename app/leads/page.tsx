import { Suspense } from 'react';
import { LeadsPage } from '@/components/leads/LeadsPage';

export default function Leads() {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Reading the pipeline…</p>}>
      <LeadsPage />
    </Suspense>
  );
}
