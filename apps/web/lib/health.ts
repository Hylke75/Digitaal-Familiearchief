import type { HealthStatus } from '@dla/archive';

/** Message key under `health` for a given internal health status. */
export function healthKey(status: HealthStatus): string {
  switch (status) {
    case 'safe':
      return 'safe';
    case 'archiving':
      return 'archiving';
    case 'action_required':
      return 'actionRequired';
    case 'temporary_problem':
      return 'temporaryProblem';
  }
}
