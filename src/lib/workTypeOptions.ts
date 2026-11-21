export function availableWorkTypes<T extends { label: string; code?: string | null }>(values: T[]): T[] {
  return values.filter(value => !['manhwa', 'manhua', 'manhwas', 'manhuas'].includes(
    (value.code || value.label).trim().toLocaleLowerCase('pt-BR')
  ));
}
