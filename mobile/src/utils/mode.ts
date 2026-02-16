import { Role } from '../types';

export type AppMode = 'ADMIN' | 'REPARTIDOR';

export function availableModes(role: Role): AppMode[] {
  if (role === 'ADMIN') {
    return ['ADMIN', 'REPARTIDOR'];
  }
  return ['REPARTIDOR'];
}

export function isModeAllowed(role: Role, mode: AppMode): boolean {
  return availableModes(role).includes(mode);
}
