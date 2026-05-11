// src/hooks/useSearch.js
// Generic client-side search + filter hook.
import { useState, useMemo } from 'react';

export function useSearch(items = [], searchKeys = []) {
  const [query, setQuery]   = useState('');
  const [filters, setFilters] = useState({});

  const filtered = useMemo(() => {
    let result = items;

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(item =>
        searchKeys.some(key => String(item[key] ?? '').toLowerCase().includes(q))
      );
    }

    Object.entries(filters).forEach(([key, val]) => {
      if (val && val !== 'All') {
        result = result.filter(item => String(item[key]) === String(val));
      }
    });

    return result;
  }, [items, query, filters, searchKeys]);

  const clearFilters = () => {
    setQuery('');
    setFilters({});
  };

  return { query, setQuery, filters, setFilters, filtered, clearFilters };
}
