/**
 * [IMPLEMENT IN REACT — NOT AI]
 * Client-side PII masking before CSV reaches the backend.
 * FairLens never sees your customers' real identities.
 */

// Columns that should NEVER leave the browser raw
const PII_COLUMNS = [
  'name', 'full_name', 'applicant_name',
  'aadhaar', 'aadhaar_number', 'pan', 'pan_number',
  'phone', 'mobile', 'email', 'address',
  'dob', 'date_of_birth'
];

/**
 * Simple FNV-1a hash (fast, consistent, non-reversible for demo purposes)
 */
function hashValue(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return 'MASKED_' + hash.toString(16).toUpperCase();
}

/**
 * Given parsed CSV rows (array of objects), mask all PII columns.
 * Returns: { maskedRows, maskedColumns, report }
 */
export function maskPII(rows) {
  if (!rows || rows.length === 0) return { maskedRows: rows, maskedColumns: [], report: 'No data' };

  const columns = Object.keys(rows[0]);
  const maskedColumns = columns.filter(col =>
    PII_COLUMNS.some(pii => col.toLowerCase().includes(pii))
  );

  const maskedRows = rows.map(row => {
    const clean = { ...row };
    maskedColumns.forEach(col => {
      if (clean[col]) {
        clean[col] = hashValue(String(clean[col]));
      }
    });
    return clean;
  });

  return {
    maskedRows,
    maskedColumns,
    report: maskedColumns.length > 0
      ? `🔒 ${maskedColumns.length} PII column(s) masked client-side: ${maskedColumns.join(', ')}. Raw identities never left your browser.` 
      : '✅ No PII columns detected.'
  };
}

/**
 * Parse CSV string into array of row objects
 */
export function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
  });
}
