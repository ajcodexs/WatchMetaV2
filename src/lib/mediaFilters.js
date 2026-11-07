const FILTER_KEYS = ['genre', 'year', 'runtime', 'service', 'language', 'country', 'age', 'keyword']

export function countActiveMediaFilters(params, type = 'movie') {
  return FILTER_KEYS.filter((key) => (
    (key !== 'runtime' || type === 'movie') &&
    Boolean(params.get(key)?.trim())
  )).length
}
