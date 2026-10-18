import { LeadDetail } from '@/components/leads/LeadDetail';

export default async function LeadPage({ params }: PageProps<'/leads/[id]'>) {
  const { id } = await params;
  return <LeadDetail id={id} />;
}
