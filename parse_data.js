const fs = require('fs');

const raw = fs.readFileSync('attendance-registration-form-2026-10-14.csv', 'utf8');

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const rows = [];
  
  for (let line of lines) {
    // Basic regex parser for CSV with quotes
    const matches = [];
    let match;
    const re = /(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^,]+)|(?<=,)(?=,)|^(?=,)|(?<=,)$/g;
    let parts = [];
    
    // Custom robust line parse
    let inQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuote = !inQuote;
      } else if (c === ',' && !inQuote) {
        parts.push(entry.trim());
        entry = '';
      } else {
        entry += c;
      }
    }
    parts.push(entry.trim());
    
    // strip surrounding quotes if any
    parts = parts.map(p => {
      if (p.startsWith('"') && p.endsWith('"')) {
        return p.slice(1, -1).replace(/""/g, '"').trim();
      }
      return p.trim();
    });
    
    rows.push(parts);
  }
  return rows;
}

const parsed = parseCSV(raw);
console.log('Total parsed rows:', parsed.length);
const header = parsed[0];
console.log('Header:', header);

const attendees = [];
for (let i = 1; i < parsed.length; i++) {
  const row = parsed[i];
  const first = row[0] || '';
  const middle = row[1] || '';
  const last = row[2] || '';
  
  // Clean full name
  const nameParts = [first, middle, last].filter(p => p && p.trim().length > 0);
  const fullName = nameParts.join(' ').replace(/\s+/g, ' ');
  
  // Detect if Arabic
  const isArabic = /[\u0600-\u06FF]/.test(fullName);
  
  attendees.push({
    id: 'reg-' + String(i).padStart(3, '0'),
    originalIndex: i,
    firstName: first,
    middleName: middle,
    lastName: last,
    fullName: fullName,
    language: isArabic ? 'ar' : 'en',
    isWalkIn: false,
    attended: false,
    checkInTime: null
  });
}

console.log('Total attendees extracted:', attendees.length);
console.log('First 3:', attendees.slice(0, 3));
console.log('Attendees with middle name count:', attendees.filter(a => a.middleName).length);
console.log('Arabic attendees count:', attendees.filter(a => a.language === 'ar').length);
console.log('English attendees count:', attendees.filter(a => a.language === 'en').length);

fs.writeFileSync('initial-data.json', JSON.stringify(attendees, null, 2), 'utf8');
console.log('Saved initial-data.json successfully!');
