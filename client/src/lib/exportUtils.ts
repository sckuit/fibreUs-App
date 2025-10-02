// Utility functions for exporting data to CSV

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle null/undefined
        if (value === null || value === undefined) return '';
        // Handle objects/arrays by stringifying
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        // Handle strings with commas or quotes
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper to flatten nested objects for CSV export
export function flattenObject(obj: any, prefix = ''): any {
  return Object.keys(obj).reduce((acc: any, key: string) => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}_${key}` : key;
    
    if (value === null || value === undefined) {
      acc[newKey] = '';
    } else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(acc, flattenObject(value, newKey));
    } else if (Array.isArray(value)) {
      acc[newKey] = value.join('; ');
    } else {
      acc[newKey] = value;
    }
    
    return acc;
  }, {});
}

// Export with flattened nested data
export function exportToCSVFlattened(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const flattenedData = data.map(item => flattenObject(item));
  exportToCSV(flattenedData, filename);
}

// Download a CSV template with specified headers
export function downloadCSVTemplate(headers: string[], filename: string) {
  const csvContent = headers.join(',');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_template.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Download inventory template with required headers
export function downloadInventoryTemplate() {
  const headers = [
    'sku',
    'name',
    'description',
    'category',
    'quantityInStock',
    'minimumStockLevel',
    'unitOfMeasure',
    'unitCost',
    'supplier',
    'location',
    'notes'
  ];
  
  downloadCSVTemplate(headers, 'inventory');
}

// Parse CSV file and return array of objects
export function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return [];
  }

  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  // Parse data rows
  const data = lines.slice(1).map(line => {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    // Handle CSV with quoted values containing commas
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim().replace(/^"|"$/g, ''));
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    // Push the last value
    values.push(currentValue.trim().replace(/^"|"$/g, ''));
    
    // Create object from headers and values
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row;
  });
  
  return data;
}
