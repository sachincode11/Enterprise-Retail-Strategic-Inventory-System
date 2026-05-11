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

export default function useScannerSocket(onScan) {
  const [status, setStatus] = useState(globalSocket?.readyState === WebSocket.OPEN ? 'connected' : 'connecting');
  const onScanRef = useRef(onScan);

  // Keep callback ref updated to avoid stale closures
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const storeId = getStoreId();
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${window.location.origin.replace(/^http/, 'ws')}/api/iot/ws/${storeId}`;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'BARCODE_SCAN') {
          console.log('[ScannerWS] Received Scan:', data);

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

    const connect = () => {
      // If already connecting or open, don't start a new one
      if (globalSocket && (globalSocket.readyState === WebSocket.CONNECTING || globalSocket.readyState === WebSocket.OPEN)) {
        return;
      }

      console.log(`[ScannerWS] Initializing Singleton Connection: ${wsUrl}`);
      globalSocket = new WebSocket(wsUrl);

      globalSocket.onopen = () => {
        console.log('[ScannerWS] Connected');
        listeners.forEach(updateStatus => updateStatus('connected'));
      };

      globalSocket.onclose = () => {
        console.log('[ScannerWS] Disconnected. Reconnecting...');
        listeners.forEach(updateStatus => updateStatus('disconnected'));
        globalSocket = null;
        setTimeout(connect, 3000);
      };

      globalSocket.onerror = () => {
        if (globalSocket) globalSocket.close();
      };

      // Re-attach message listener if socket was replaced
      globalSocket.addEventListener('message', handleMessage);
    };

    // Register this hook instance's status setter
    listeners.add(setStatus);

    // Ensure connection exists
    connect();

    // Add message listener to the existing socket
    if (globalSocket) {
      globalSocket.addEventListener('message', handleMessage);
    }

    return () => {
      listeners.delete(setStatus);
      if (globalSocket) {
        globalSocket.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  return { status };
}
