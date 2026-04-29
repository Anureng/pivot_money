/**
 * Calculates holdings, asset breakdown, and net worth
 */

const calculatePortfolio = (deduplicatedData) => {
  const holdingsMap = {};
  const breakdown = {
    mutualFunds: 0,
    equities: 0,
    deposits: 0
  };
  let netWorth = 0;

  deduplicatedData.forEach(tx => {
    if (!tx.isin) return; // Safely skip if no isin

    // Skip pending or failed orders (e.g. from order.json)
    const validStatuses = ['MATCHED', 'COMPLETED'];
    if (tx.status && !validStatuses.includes(tx.status.toUpperCase())) {
      return;
    }

    // Initialize holding if not exists
    if (!holdingsMap[tx.isin]) {
      holdingsMap[tx.isin] = {
        isin: tx.isin,
        folio: tx.folio,
        assetName: tx.assetName || tx.isin,
        type: tx.type,
        totalQuantity: 0,
        totalInvestment: 0,
        currentValue: 0
      };
    }

    const holding = holdingsMap[tx.isin];

    if (tx.action === 'BUY') {
      holding.totalQuantity += tx.quantity;
      holding.totalInvestment += tx.amount;
    } else if (tx.action === 'SELL') {
      holding.totalQuantity -= tx.quantity;
      // Subtracting quantity but simplified amount subtraction for net investment
      holding.totalInvestment -= tx.amount;
    }

    // Asset Breakdown mapping
    let valueToAdd = tx.action === 'BUY' ? tx.amount : -tx.amount;

    if (tx.type === 'MUTUAL_FUND') {
      breakdown.mutualFunds += valueToAdd;
    } else if (tx.type === 'EQUITY') {
      breakdown.equities += valueToAdd;
    } else if (tx.type === 'DEPOSIT') {
      breakdown.deposits += valueToAdd;
    }

    netWorth += valueToAdd;
  });

  // Calculate current value for holdings (fallback mechanism: use price * qty if price exists, else totalInvestment)
  Object.values(holdingsMap).forEach(holding => {
    // We don't have current live prices in this dataset typically,
    // so we fall back to the calculated net investment as the 'current value'.
    holding.currentValue = holding.totalInvestment;
  });

  return {
    netWorth,
    breakdown,
    holdings: Object.values(holdingsMap),
    transactions: deduplicatedData
  };
};

module.exports = {
  calculatePortfolio
};
