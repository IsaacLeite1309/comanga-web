import { describe, expect, it } from 'vitest';
import { availableWorkTypes } from '@/lib/workTypeOptions';

describe('tipos retirados do catálogo', () => {
  it('oculta Manhwa e Manhua de respostas e caches antigos sem alterar os demais tipos', () => {
    const manga = { id: 1, label: 'Mangá', code: 'manga' };
    const novel = { id: 2, label: 'Novel' };
    expect(availableWorkTypes([manga, { id: 3, label: 'Outro rótulo', code: 'manhwa' }, { id: 4, label: ' MANHUA ' }, novel])).toEqual([manga, novel]);
    expect(manga).toEqual({ id: 1, label: 'Mangá', code: 'manga' });
  });
});
