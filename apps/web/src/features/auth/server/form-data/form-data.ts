/**
 * Reads a form field as text. A missing field or a file upload is `''`, so the
 * callers never have to narrow `FormDataEntryValue` themselves.
 */
export function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}
