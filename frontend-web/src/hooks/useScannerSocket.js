import { useEffect, useRef, useState } from 'react';
import { getStoreId } from '../services/apiClient';

/**
 * Singleton WebSocket Instance
 * --------------------------
 * We keep the socket outside the hook to ensure only ONE connection
 * exists per browser tab, preventing "multiple items added" bugs.
 */
let globalSocket = null;
let listeners = new Set();

// How long (ms) without a device heartbeat before we declare "No Device"
const DEVICE_TIMEOUT_MS = 45_000;

// How often (ms) we poll the /iot/health endpoint
const HEALTH_POLL_INTERVAL_MS = 15_000;

/**
 * Derive the display status:
 *   'connected'    → WS open AND a physical IoT device has pinged recently
 *   'no_device'    → WS open but NO physical scanner has been seen lately
 *   'connecting'   → WS is being established
 *   'disconnected' → WS is closed / failed
 */
function deriveStatus(wsOpen, deviceSeen) {
  if (!wsOpen) return 'connecting';
  return deviceSeen ? 'connected' : 'no_device';
}

export default function useScannerSocket(onScan) {
  const [wsOpen, setWsOpen] = useState(
    globalSocket?.readyState === WebSocket.OPEN
  );
  const [deviceSeen, setDeviceSeen] = useState(false);
  const onScanRef = useRef(onScan);
  const healthTimerRef = useRef(null);

  // Keep callback ref updated to avoid stale closures
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const storeId = getStoreId();
    // Use explicit /api/v1 to avoid proxy rewrite ambiguities
    const wsUrl = `${window.location.origin.replace(/^http/, 'ws')}/api/v1/iot/ws/${storeId}`;

    // ------------------------------------------------------------------
    // Derive the base API URL for health polling (http, not ws)
    // ------------------------------------------------------------------
    const apiBase = window.location.origin;
    const healthUrl = `${apiBase}/api/v1/iot/health`;

    console.log(`[ScannerWS] Initializing for Store ${storeId}`);
    console.log(`[ScannerWS] WS URL: ${wsUrl}`);
    console.log(`[ScannerWS] Health URL: ${healthUrl}`);

    // ------------------------------------------------------------------
    // Health polling — checks if a real ESP32 device has pinged recently
    // ------------------------------------------------------------------
    const pollHealth = async () => {
      try {
        const res = await fetch(healthUrl, { credentials: 'include' });
        if (!res.ok) { 
          console.warn(`[ScannerWS] Health check failed: ${res.status}`);
          setDeviceSeen(false); 
          return; 
        }
        const data = await res.json();
        
        // Check if any device for our store has been seen recently
        const devices = data.registered_devices || [];
        const activeDevice = devices.find(d => 
          Number(d.store_id) === Number(storeId) && d.status === 'Online'
        );

        if (activeDevice) {
          if (!deviceSeen) console.log(`[ScannerWS] Device found: ${activeDevice.device_id} (RSSI: ${activeDevice.rssi})`);
          setDeviceSeen(true);
        } else {
          if (deviceSeen) console.log(`[ScannerWS] No active devices found for Store ${storeId}`);
          setDeviceSeen(false);
          if (devices.length > 0) {
             console.log(`[ScannerWS] Registry has ${devices.length} devices, but none match Store ${storeId} + Online status.`);
             console.table(devices);
          }
        }
      } catch (err) {
        console.error(`[ScannerWS] Health poll error:`, err);
        setDeviceSeen(false);
      }
    };


    // ------------------------------------------------------------------
    // WebSocket message handler
    // ------------------------------------------------------------------
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.event === 'CONNECTED') {
          // Server acknowledged connection — WS is live, now check device
          pollHealth();
          return;
        }

        if (data.event === 'BARCODE_SCAN') {
          console.log('[ScannerWS] Received Scan:', data);
          // A scan arriving means the device is definitely alive
          setDeviceSeen(true);

          const product = {
            id: data.product_id,
            name: data.product_name,
            sku: data.sku,
            barcode: data.barcode,
            price: data.unit_price,
            priceNum: data.unit_price,
            stock: data.stock,
            category_id: data.category_id,
          };

          if (onScanRef.current) onScanRef.current(product);
        }
      } catch (err) {
        console.error('[ScannerWS] Error:', err);
      }
    };

    // ------------------------------------------------------------------
    // WebSocket connection
    // ------------------------------------------------------------------
    const connect = () => {
      if (
        globalSocket &&
        (globalSocket.readyState === WebSocket.CONNECTING ||
          globalSocket.readyState === WebSocket.OPEN)
      ) {
        return;
      }

      console.log(`[ScannerWS] Initializing Singleton Connection: ${wsUrl}`);
      globalSocket = new WebSocket(wsUrl);

      globalSocket.onopen = () => {
        console.log('[ScannerWS] WebSocket open (server reachable)');
        listeners.forEach((fn) => fn(true));
      };

      globalSocket.onclose = () => {
        console.log('[ScannerWS] WebSocket closed. Reconnecting in 3s...');
        listeners.forEach((fn) => fn(false));
        globalSocket = null;
        setTimeout(connect, 3000);
      };

      globalSocket.onerror = () => {
        if (globalSocket) globalSocket.close();
      };

      globalSocket.addEventListener('message', handleMessage);
    };

    // Register this hook instance's WS-open setter
    listeners.add(setWsOpen);

    // Ensure WS connection exists
    connect();

    // Attach message listener if socket already existed
    if (globalSocket) {
      globalSocket.addEventListener('message', handleMessage);
    }

    // Poll health immediately then on an interval
    pollHealth();
    healthTimerRef.current = setInterval(pollHealth, HEALTH_POLL_INTERVAL_MS);

    return () => {
      listeners.delete(setWsOpen);
      clearInterval(healthTimerRef.current);
      if (globalSocket) {
        globalSocket.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  const status = deriveStatus(wsOpen, deviceSeen);
  return { status };
}
