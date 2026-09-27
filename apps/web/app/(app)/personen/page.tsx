import { redirect } from 'next/navigation';
import { GenericPlaceholder } from '@/components/GenericPlaceholder';
import { isDemo } from '@/lib/demo/mode';

export default function Page() {
  if (isDemo()) redirect('/fotos/personen');
  return <GenericPlaceholder navKey="people" />;
}
