/**
 * Removes duplicate transactions based on: isin + folio + date + amount
 * Rule: Keep Account Aggregator (AA) over MF Central (MF)
 */

const deduplicate = (normalizedData) => {
  const uniqueMap = new Map();

  normalizedData.forEach(record => {
    // Unique composite key
    const key = `${record.isin}-${record.folio}-${record.date}-${record.amount}`;

    if (uniqueMap.has(key)) {
      const existingRecord = uniqueMap.get(key);
      
      // If duplicate found and existing is MF while current is AA, replace it
      if (existingRecord.source === 'MF' && record.source === 'AA') {
        uniqueMap.set(key, record);
      }
      // If the current record is MF and existing is AA, we just discard the current (do nothing)
    } else {
      uniqueMap.set(key, record);
    }
  });

  return Array.from(uniqueMap.values());
};

module.exports = {
  deduplicate
};
