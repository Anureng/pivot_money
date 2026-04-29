/**
 * Normalizes different data sources into a unified schema.
 */

const normalizeAA = (data) => {
  // Extract transactions correctly from AA JSON
  let rawTransactions = [];
  if (data?.users?.[0]?.accounts) {
    data.users[0].accounts.forEach(acc => {
      if (acc.transactions) {
        rawTransactions = rawTransactions.concat(acc.transactions);
      }
    });
  }
  const transactions = Array.isArray(rawTransactions) ? rawTransactions : [];

  // Standardize asset type mapping
  const mapAssetType = (type) => {
    if (!type) return 'UNKNOWN';
    const t = type.toString().toUpperCase();
    if (t.includes('DEPOSIT')) return 'DEPOSIT';
    if (t.includes('EQUITY') || t.includes('STOCK')) return 'EQUITY';
    return 'UNKNOWN';
  };
  // Use the previously extracted and validated transactions array

  return transactions.map(item => {
    let action = item.action || item.type;

    if (action === 'DEBIT') action = 'BUY';
    if (action === 'CREDIT') action = 'SELL';

    return {
      source: 'AA',
      type: mapAssetType(item.assetType),
      isin: item.isin || `AA_DEPOSIT_${item.maskedAccNumber || 'ACC'}`,
      folio: item.folio || '',
      transactionId: item.transactionId || item.txnId,
      date: item.date || (item.transactionTimestamp ? new Date(item.transactionTimestamp).toISOString() : new Date().toISOString()),
      action: action,
      quantity: Number(item.quantity || 0),
      amount: Number(item.amount || 0),
      price: Number(item.price || 0),
      assetName: item.narration ? item.narration.substring(0, 30) + '...' : 'Bank Deposit',
      description: item.narration || '',
      status: 'COMPLETED' // AA transactions are settled bank statements
    };
  });
};

const normalizeMF = (data) => {
  // Extract from mf_central.json properly
  let rawTransactions = [];
  if (data?.users?.[0]?.validateQRCode?.data?.[0]?.dtTransaction) {
    rawTransactions = data.users[0].validateQRCode.data[0].dtTransaction;
  }
  const transactions = Array.isArray(rawTransactions) ? rawTransactions : [];

  return transactions.map(item => {
    let action = item.trxnSign === '+' ? 'BUY' : 'SELL';

    return {
      source: 'MF',
      type: 'MUTUAL_FUND',
      isin: item.isin,
      folio: item.folio,
      transactionId: item.trxnNo || item.transactionId,
      date: item.trxnDate, // ✅ FIXED
      action: action,
      quantity: Number(item.trxnUnits || item.units || 0), // Handle trxnUnits for MF Central
      amount: Number(item.trxnAmount || 0), // ✅ FIXED
      price: Number(item.purchasePrice || item.nav || 0), // optional
      assetName: item.schemeName || 'Mutual Fund',
      description: item.trxnDesc || '',
      status: 'COMPLETED' // MF Central is settled RTA data
    };
  });
};

const normalizeOrder = (data) => {
  return data.map(item => {
    return {
      source: 'ORDER',
      type: 'MUTUAL_FUND',
      isin: item.order_src_info?.src_isin || item.isin || 'UNKNOWN_ISIN',
      folio: item.folio_num || item.folio || '',
      transactionId: item.mem_ord_ref_id || item.id,
      date: item.placed_at || item.date,
      action: item.type === 'p' ? 'BUY' : 'SELL', // p = purchase, otherwise SELL
      quantity: Number(item.quantity || 0),
      amount: Number(item.amount || 0),
      price: Number(item.price || 0),
      assetName: item.src_scheme_name || 'Mutual Fund Order',
      description: `Order via ${item.payment_mode || 'System'}`,
      status: item.status ? item.status.toUpperCase() : 'UNKNOWN'
    };
  });
};

const normalizeAll = (aaData, mfData, orderData) => {
  const normalizedAA = normalizeAA(aaData);
  const normalizedMF = normalizeMF(mfData);
  const normalizedOrder = normalizeOrder(orderData);

  return [...normalizedAA, ...normalizedMF, ...normalizedOrder];
};

module.exports = {
  normalizeAA,
  normalizeMF,
  normalizeOrder,
  normalizeAll
};
