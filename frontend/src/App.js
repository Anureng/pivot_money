import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, Clock, Layers, ArrowUpRight, ArrowDownRight, Activity 
} from 'lucide-react';
import './App.css';

// Colors for Chart
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981'];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

function NetWorthCard({ netWorth, breakdown }) {
  const totalInflows = breakdown.mutualFunds + breakdown.equities + breakdown.deposits; // Simplified stat
  
  return (
    <div className="glass-panel net-worth-card animate-fade-in">
      <div className="nw-label">
        <Wallet size={18} className="text-accent-primary" />
        Total Portfolio Value
      </div>
      <div className="nw-value">
        {formatCurrency(netWorth)}
      </div>
      <div className="nw-stats">
        <div className="nw-stat-item">
          <span className="nw-stat-label">Mutual Funds</span>
          <span className="nw-stat-val text-success">{formatCurrency(breakdown.mutualFunds || 0)}</span>
        </div>
        <div className="nw-stat-item">
          <span className="nw-stat-label">Deposits</span>
          <span className="nw-stat-val text-accent-secondary">{formatCurrency(breakdown.deposits || 0)}</span>
        </div>
      </div>
    </div>
  );
}

function AllocationChart({ breakdown }) {
  const data = [
    { name: 'Mutual Funds', value: Math.abs(breakdown.mutualFunds || 0) },
    { name: 'Equities', value: Math.abs(breakdown.equities || 0) },
    { name: 'Deposits', value: Math.abs(breakdown.deposits || 0) },
  ].filter(item => item.value > 0);

  return (
    <div className="glass-panel allocation-card animate-fade-in" style={{animationDelay: '0.1s'}}>
      <div className="allocation-header flex-center" style={{justifyContent: 'flex-start', gap: '0.5rem'}}>
        <Layers size={20} className="text-accent-secondary" />
        Asset Allocation
      </div>
      <div className="chart-container">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-muted">No data available</div>
        )}
      </div>
    </div>
  );
}

function HoldingsTable({ holdings }) {
  return (
    <div className="glass-panel animate-fade-in" style={{animationDelay: '0.2s'}}>
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Type</th>
              <th style={{textAlign: 'right'}}>Total Qty</th>
              <th style={{textAlign: 'right'}}>Net Invested</th>
              <th style={{textAlign: 'right'}}>Current Value</th>
            </tr>
          </thead>
          <tbody>
            {holdings.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center'}} className="text-muted">No holdings found</td></tr>
            ) : holdings.map((h, i) => (
              <tr key={h.isin + i}>
                <td>
                  <div className="flex-center" style={{justifyContent: 'flex-start', gap: '1rem'}}>
                    <div className="asset-icon-box">
                      <Activity size={18} className="text-accent-primary" />
                    </div>
                    <div>
                      <div className="asset-name">{h.assetName || `Asset ${i+1}`}</div>
                      <div className="asset-id">{h.isin} {h.folio ? `• Folio: ${h.folio}` : ''}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${h.type === 'MUTUAL_FUND' ? 'badge-primary' : h.type === 'DEPOSIT' ? 'badge-secondary' : 'badge-outline'}`}>
                    {h.type.replace('_', ' ')}
                  </span>
                </td>
                <td style={{textAlign: 'right'}} className="amount-display">
                  {h.totalQuantity.toFixed(4)}
                </td>
                <td style={{textAlign: 'right'}} className="amount-display">
                  {formatCurrency(h.totalInvestment)}
                </td>
                <td style={{textAlign: 'right'}} className="amount-display text-success">
                  {formatCurrency(h.currentValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransactionsTable({ transactions }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sort by date desc
  const sortedTx = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const totalPages = Math.ceil(sortedTx.length / itemsPerPage);
  const currentData = sortedTx.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  return (
    <div className="glass-panel animate-fade-in" style={{animationDelay: '0.2s'}}>
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Details</th>
              <th>Source</th>
              <th>Action</th>
              <th style={{textAlign: 'right'}}>Qty / Amount</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center'}} className="text-muted">No transactions found</td></tr>
            ) : currentData.map((tx, i) => (
              <tr key={tx.transactionId + i}>
                <td style={{whiteSpace: 'nowrap'}}>{formatDate(tx.date)}</td>
                <td>
                  <div className="asset-name">{tx.assetName || tx.type.replace('_', ' ')}</div>
                  <div className="asset-id">{tx.description || `ID: ${tx.transactionId || 'N/A'}`}</div>
                  {tx.status && tx.status !== 'COMPLETED' && tx.status !== 'MATCHED' && (
                    <div className="asset-id text-warning" style={{marginTop: '2px'}}>Status: {tx.status}</div>
                  )}
                </td>
                <td>
                  <span className="badge badge-outline">{tx.source}</span>
                </td>
                <td>
                  {tx.action === 'BUY' ? (
                    <span className="badge badge-success" style={{display: 'inline-flex', gap: '4px'}}>
                      <ArrowDownRight size={14} /> BUY
                    </span>
                  ) : (
                    <span className="badge badge-danger" style={{display: 'inline-flex', gap: '4px'}}>
                      <ArrowUpRight size={14} /> SELL
                    </span>
                  )}
                </td>
                <td style={{textAlign: 'right'}}>
                  <div className="amount-display">
                    {tx.action === 'BUY' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                  {tx.quantity > 0 && (
                    <div className="asset-id" style={{marginTop: '0.25rem'}}>
                      {tx.quantity.toFixed(4)} Units
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex-between" style={{padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)'}}>
          <span className="text-muted" style={{fontSize: '0.85rem'}}>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedTx.length)} of {sortedTx.length} entries
          </span>
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <button className="btn btn-ghost" onClick={handlePrev} disabled={currentPage === 1} style={{padding: '0.5rem 1rem'}}>
              Previous
            </button>
            <button className="btn btn-ghost" onClick={handleNext} disabled={currentPage === totalPages} style={{padding: '0.5rem 1rem'}}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('holdings');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/portfolio');
        setData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load portfolio data. Make sure the backend is running.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <div className="text-muted animate-pulse">Aggregating Wealth Data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <div className="glass-panel" style={{padding: '2rem', textAlign: 'center'}}>
          <TrendingDown size={48} className="text-danger" style={{margin: '0 auto 1rem'}} />
          <h3>Connection Error</h3>
          <p className="text-muted mt-2">{error}</p>
          <button className="btn btn-primary mt-4" onClick={() => window.location.reload()} style={{marginTop: '1.5rem'}}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header animate-fade-in">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={24} color="#fff" />
          </div>
          <span className="brand-title">Pivot Wealth</span>
        </div>
        <div className="user-profile">
          <span className="text-muted" style={{fontSize: '0.9rem'}}>{data.userInfo?.name || 'Demo User'}</span>
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(data.userInfo?.name || 'Demo User')}&background=3b82f6&color=fff`} alt="User Avatar" className="avatar" />
        </div>
      </header>

      {/* Top Grid */}
      <div className="dashboard-grid">
        <NetWorthCard netWorth={data.netWorth} breakdown={data.breakdown} />
        <AllocationChart breakdown={data.breakdown} />
      </div>

      {/* Main Content Area */}
      <div className="content-section">
        <div className="flex-between">
          <h3>Portfolio Details</h3>
          <div className="tabs animate-fade-in">
            <button 
              className={`btn btn-ghost ${activeTab === 'holdings' ? 'active' : ''}`}
              onClick={() => setActiveTab('holdings')}
            >
              <TrendingUp size={16} /> Current Holdings
            </button>
            <button 
              className={`btn btn-ghost ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              <Clock size={16} /> Recent Activity
            </button>
          </div>
        </div>

        {activeTab === 'holdings' && <HoldingsTable holdings={data.holdings} />}
        {activeTab === 'transactions' && <TransactionsTable transactions={data.transactions} />}
      </div>
    </div>
  );
}

export default App;
