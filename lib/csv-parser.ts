export interface CSVRow {
  name: string
  phone: string
  email?: string
  address?: string
  area?: string
  city: string
  category: string
}

export function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.split('\n').filter(line => line.trim().length > 0)
  if (lines.length === 0) return []

  // Try to detect header row
  const firstLine = lines[0].toLowerCase()
  const hasHeader = firstLine.includes('name') && firstLine.includes('phone')
  
  const dataLines = hasHeader ? lines.slice(1) : lines
  const rows: CSVRow[] = []

  for (const line of dataLines) {
    // Simple CSV parsing - handles quoted fields
    const values = parseCSVLine(line)
    if (values.length < 2) continue // Need at least name and phone

    const row: CSVRow = {
      name: (values[0] || '').trim(),
      phone: (values[1] || '').trim(),
      email: values[2]?.trim() || undefined,
      address: values[3]?.trim() || undefined,
      area: values[4]?.trim() || undefined,
      city: (values[5] || '').trim().toUpperCase(),
      category: (values[6] || '').trim().toUpperCase().replace(/\s+/g, '_'),
    }

    // Validate required fields
    if (row.name && row.phone && (row.city === 'LAGOS' || row.city === 'ABUJA')) {
      rows.push(row)
    }
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  values.push(current) // Add last value
  return values
}
