export const exportToCSV = (data, filename) => {
  if (!data || !data.length) {
    alert("No data to export");
    return;
  }
  
  // Get all keys from the first object
  const keys = Object.keys(data[0]);
  
  // Format the CSV content: header row + data rows
  const csvContent = [
    keys.join(','),
    ...data.map(row => 
      keys.map(k => {
        let val = row[k] === null || row[k] === undefined ? '' : row[k];
        
        // Convert to string in case it's a number/boolean
        val = String(val);

        // Escape quotes
        val = val.replace(/"/g, '""');
        
        // Wrap in quotes if there are commas, quotes, or newlines
        if (val.search(/("|,|\n)/g) >= 0) {
          val = `"${val}"`;
        }
        return val;
      }).join(',')
    )
  ].join('\n');

  // Create a blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
