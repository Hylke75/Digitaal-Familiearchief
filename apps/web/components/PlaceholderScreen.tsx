import { PageHeader } from '@/components/app-shell/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Reusable "section exists, no content yet" screen. Several navigation
 * destinations are placeholders in this phase (docs/DESIGN.md §30); they still
 * present a calm, inviting empty state rather than a dead end.
 */
export function PlaceholderScreen({
  title,
  subtitle,
  icon,
  emptyTitle,
  emptyBody,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  emptyTitle: string;
  emptyBody: string;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <EmptyState icon={icon} title={emptyTitle} description={emptyBody} action={action} />
    </div>
  );
}
