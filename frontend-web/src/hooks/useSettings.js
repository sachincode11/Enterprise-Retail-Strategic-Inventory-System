// src/hooks/useSettings.js
import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../services/settingsService';

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    getSettings().then(res => {
      setSettings(res.data);
      setLoading(false);
    });
  }, []);

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const save = async (overrides) => {
    setSaving(true);
    try {
      const res = await saveSettings(overrides ?? settings);
      setSettings(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return { settings, loading, saving, saved, update, save };
}
