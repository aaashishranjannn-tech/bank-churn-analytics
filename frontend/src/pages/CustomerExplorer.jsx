import React, { useState, useMemo } from 'react';
import { SAMPLE_CUSTOMERS } from '../data/analyticsData';

const PAGE_SIZE = 20;

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(57,255,20,0.2)',
  borderRadius: '2px',
  color: '#f5f0e8',
  fontFamily: "'Inter', sans-serif",
  fontSize: '0.82rem',
  padding: '0.55rem 0.75rem',
  outline: 'none',
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
};

export default function CustomerExplorer() {
  const [search, setSearch] = useState('');
  const [geoFilter, setGeoFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [churnFilter, setChurnFilter] = useState('All');
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(90);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return SAMPLE_CUSTOMERS.filter(c => {
      if (search && !String(c.id).includes(search) && !c.surname.toLowerCase().includes(search.toLowerCase())) return false;
      if (geoFilter !== 'All' && c.geography !== geoFilter) return false;
      if (genderFilter !== 'All' && c.gender !== genderFilter) return false;
      if (churnFilter === 'Churned' && c.churn !== 1) return false;
      if (churnFilter === 'Retained' && c.churn !== 0) return false;
      if (c.age < ageMin || c.age > ageMax) return false;
      return true;
    });
  }, [search, geoFilter, genderFilter, churnFilter, ageMin, ageMax]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handleGeo = (e) => { setGeoFilter(e.target.value); setPage(1); };
  const handleGender = (e) => { setGenderFilter(e.target.value); setPage(1); };
  const handleChurn = (e) => { setChurnFilter(e.target.value); setPage(1); };

  const thStyle = {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '0.55rem',
    letterSpacing: '0.2em',
    color: '#8a8a8a',
    textTransform: 'uppercase',
    padding: '0.75rem 1rem',
    textAlign: 'left',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    whiteSpace: 'nowrap',
    fontWeight: 500,
  };

  const tdStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.78rem',
    color: '#f5f0e8',
    padding: '0.65rem 1rem',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '7rem clamp(1rem, 4vw, 3rem) 4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.6rem', letterSpacing: '0.35em', color: '#39ff14', marginBottom: '0.5rem' }}>
          07 / CUSTOMER EXPLORER
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', fontWeight: 700, color: '#f5f0e8', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Customer Database
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', color: '#8a8a8a' }}>
          Showing sample of 200 customers · {filtered.length} matching results
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1.5rem',
          background: 'rgba(57,255,20,0.03)',
          border: '1px solid rgba(57,255,20,0.08)',
        }}
      >
        {/* Search */}
        <div style={{ flex: '1 1 200px' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.55rem', letterSpacing: '0.2em', color: '#8a8a8a', marginBottom: '0.35rem' }}>
            SEARCH ID / SURNAME
          </div>
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="e.g. Hargrave or 15634602"
            style={{ ...inputStyle, width: '100%' }}
            onFocus={e => e.target.style.borderColor = '#39ff14'}
            onBlur={e => e.target.style.borderColor = 'rgba(57,255,20,0.2)'}
          />
        </div>

        {/* Geography */}
        <div style={{ flex: '0 1 140px' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.55rem', letterSpacing: '0.2em', color: '#8a8a8a', marginBottom: '0.35rem' }}>
            GEOGRAPHY
          </div>
          <select value={geoFilter} onChange={handleGeo} style={{ ...selectStyle, width: '100%' }}>
            <option>All</option>
            <option>France</option>
            <option>Germany</option>
            <option>Spain</option>
          </select>
        </div>

        {/* Gender */}
        <div style={{ flex: '0 1 130px' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.55rem', letterSpacing: '0.2em', color: '#8a8a8a', marginBottom: '0.35rem' }}>
            GENDER
          </div>
          <select value={genderFilter} onChange={handleGender} style={{ ...selectStyle, width: '100%' }}>
            <option>All</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>

        {/* Churn */}
        <div style={{ flex: '0 1 140px' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.55rem', letterSpacing: '0.2em', color: '#8a8a8a', marginBottom: '0.35rem' }}>
            CHURN STATUS
          </div>
          <select value={churnFilter} onChange={handleChurn} style={{ ...selectStyle, width: '100%' }}>
            <option>All</option>
            <option>Churned</option>
            <option>Retained</option>
          </select>
        </div>

        {/* Age range */}
        <div style={{ flex: '1 1 200px' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.55rem', letterSpacing: '0.2em', color: '#8a8a8a', marginBottom: '0.35rem' }}>
            AGE RANGE: {ageMin} – {ageMax}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="range" min="18" max="90" value={ageMin}
              onChange={e => { setAgeMin(Number(e.target.value)); setPage(1); }}
              style={{ flex: 1, accentColor: '#39ff14' }} />
            <input type="range" min="18" max="90" value={ageMax}
              onChange={e => { setAgeMax(Number(e.target.value)); setPage(1); }}
              style={{ flex: 1, accentColor: '#39ff14' }} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
          <thead>
            <tr style={{ background: 'rgba(57,255,20,0.03)' }}>
              <th style={thStyle}>Customer ID</th>
              <th style={thStyle}>Surname</th>
              <th style={thStyle}>Country</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Age</th>
              <th style={thStyle}>Credit Score</th>
              <th style={thStyle}>Balance</th>
              <th style={thStyle}>Products</th>
              <th style={thStyle}>Tenure</th>
              <th style={thStyle}>Active</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ ...tdStyle, textAlign: 'center', color: '#8a8a8a', padding: '3rem' }}>
                  No customers match the current filters.
                </td>
              </tr>
            ) : (
              pageData.map((c, i) => (
                <tr
                  key={`${c.id}-${i}`}
                  style={{
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(57,255,20,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                >
                  <td style={{ ...tdStyle, color: '#8a8a8a', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.7rem' }}>{c.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{c.surname}</td>
                  <td style={tdStyle}>{c.geography}</td>
                  <td style={tdStyle}>{c.gender}</td>
                  <td style={{ ...tdStyle, color: c.age > 45 ? '#d4a843' : '#f5f0e8' }}>{c.age}</td>
                  <td style={{ ...tdStyle, color: c.creditScore < 550 ? '#ff6633' : '#f5f0e8' }}>{c.creditScore}</td>
                  <td style={tdStyle}>
                    {c.balance === 0 ? (
                      <span style={{ color: '#8a8a8a' }}>$0</span>
                    ) : (
                      `$${c.balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: c.products >= 3 ? '#ff4444' : '#f5f0e8' }}>{c.products}</td>
                  <td style={tdStyle}>{c.tenure} yr{c.tenure !== 1 ? 's' : ''}</td>
                  <td style={tdStyle}>
                    <span style={{ color: c.active ? '#39ff14' : '#8a8a8a', fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                      {c.active ? 'YES' : 'NO'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.6rem',
                        fontSize: '0.55rem',
                        letterSpacing: '0.15em',
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 600,
                        color: c.churn ? '#d4a843' : '#39ff14',
                        border: `1px solid ${c.churn ? 'rgba(212,168,67,0.4)' : 'rgba(57,255,20,0.3)'}`,
                        background: c.churn ? 'rgba(212,168,67,0.06)' : 'rgba(57,255,20,0.05)',
                        borderRadius: '1px',
                      }}
                    >
                      {c.churn ? 'CHURNED' : 'RETAINED'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.72rem', color: '#8a8a8a' }}>
          Page {safePage} of {totalPages} · {filtered.length} results
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            style={{
              padding: '0.4rem 0.9rem',
              border: '1px solid rgba(57,255,20,0.2)',
              background: 'transparent',
              color: safePage === 1 ? '#444' : '#39ff14',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.65rem',
              letterSpacing: '0.1em',
              cursor: safePage === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ← PREV
          </button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                style={{
                  width: '32px',
                  height: '32px',
                  border: `1px solid ${safePage === pageNum ? '#39ff14' : 'rgba(57,255,20,0.15)'}`,
                  background: safePage === pageNum ? 'rgba(57,255,20,0.12)' : 'transparent',
                  color: safePage === pageNum ? '#39ff14' : '#8a8a8a',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            style={{
              padding: '0.4rem 0.9rem',
              border: '1px solid rgba(57,255,20,0.2)',
              background: 'transparent',
              color: safePage === totalPages ? '#444' : '#39ff14',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.65rem',
              letterSpacing: '0.1em',
              cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            NEXT →
          </button>
        </div>
      </div>
    </div>
  );
}
