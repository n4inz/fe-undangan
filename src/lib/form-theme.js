// Keep existing ?=theme and ?theme links separate from form metadata.
export function getFormTheme(searchParams) {
  if (!searchParams) return '';
  const explicit = searchParams.get('theme') || searchParams.get('tema') || searchParams.get('');
  if (explicit) return explicit;

  for (const [key, value] of searchParams.entries()) {
    if (!value && key && !['brand', 'ref', 'date'].includes(key)) return key;
  }
  return '';
}
