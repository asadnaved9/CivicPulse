import React, { useState } from 'react';
import { LOCALITIES, Locality } from '../utils/localities';
import { Search, MapPin, X } from 'lucide-react';

interface LocalitySelectProps {
  onSelect: (locality: Locality) => void;
  onClose?: () => void;
}

export default function LocalitySelect({ onSelect, onClose }: LocalitySelectProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Locality[]>(LOCALITIES);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) {
      setResults(LOCALITIES);
      return;
    }

    const filtered = LOCALITIES.filter(
      l => 
        l.name.toLowerCase().includes(val.toLowerCase()) || 
        l.city.toLowerCase().includes(val.toLowerCase())
    );
    setResults(filtered);
  };

  return (
    <div 
      style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        background: 'rgba(10,12,16,0.85)', zIndex: 999, 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div 
        className="card" 
        style={{ 
          width: '100%', 
          maxWidth: '460px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          maxHeight: '85vh',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>Select Your Locality</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: '4px 0 0 0' }}>
              We need a location to fetch weather and flood alerts.
            </p>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search input bar */}
        <div style={{ position: 'relative' }}>
          <Search 
            size={16} 
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} 
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px', width: '100%' }}
            placeholder="Search neighborhood (e.g. Park Street, Koramangala)..."
            value={query}
            onChange={handleSearch}
            autoFocus
          />
        </div>

        {/* Results list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '200px' }}>
          {results.length > 0 ? (
            results.map((loc) => (
              <button
                key={loc.name}
                onClick={() => onSelect(loc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                className="hover-card"
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '6px', 
                  background: 'var(--surface-2)',
                  color: 'var(--primary)'
                }}>
                  <MapPin size={16} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{loc.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{loc.city}</span>
                </div>
              </button>
            ))
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
              No matching locations found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
