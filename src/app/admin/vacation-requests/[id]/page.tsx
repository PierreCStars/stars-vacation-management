import VacationRequestClient from './VacationRequestClient';

export default async function VacationRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VacationRequestClient id={id} />;
} 