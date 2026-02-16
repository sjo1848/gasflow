import { availableModes, isModeAllowed } from '../src/utils/mode';

describe('mode permissions', () => {
  it('admin can open both modes', () => {
    expect(availableModes('ADMIN')).toEqual(['ADMIN', 'REPARTIDOR']);
    expect(isModeAllowed('ADMIN', 'ADMIN')).toBe(true);
    expect(isModeAllowed('ADMIN', 'REPARTIDOR')).toBe(true);
  });

  it('repartidor can only open repartidor mode', () => {
    expect(availableModes('REPARTIDOR')).toEqual(['REPARTIDOR']);
    expect(isModeAllowed('REPARTIDOR', 'REPARTIDOR')).toBe(true);
    expect(isModeAllowed('REPARTIDOR', 'ADMIN')).toBe(false);
  });
});
