import { cn } from '@/lib/cn';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'bg-forest inline-flex items-center justify-center rounded-full font-semibold text-white',
        size === 'sm' ? 'text-caption h-8 w-8' : 'text-small h-10 w-10',
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
