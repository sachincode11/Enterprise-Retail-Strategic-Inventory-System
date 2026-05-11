"""
backend/app/routers/scanner.py
==============================
IoT Scanner Router — ERSIS ESP32 GM67 integration layer.

ENDPOINTS
---------
  POST /api/v1/iot/scan
      • Receives a barcode POST from the ESP32 over WiFi.
      • Validates the X-IoT-Secret header.
      • Looks up the product by barcode in the store catalogue.
      • Broadcasts the product payload to all WebSocket clients watching
        that store (i.e. open POS cashier tabs).
      • Returns the product data to the ESP32 for LED/display feedback.

  GET  /api/v1/iot/ws/{store_id}
      • WebSocket endpoint consumed by the React POS frontend.
      • The frontend connects once on mount; receives scan events in real time.
      • Connection manager handles multiple concurrent cashier clients.

  GET  /api/v1/iot/health
      • Simple health probe used by S3IoTDevices.jsx to show live device status.

DESIGN RATIONALE
----------------
WebSocket over polling:
  The POS page previously had a manual barcode search box.  The cashier had
  to type or scan via USB HID.  With this router the physical ESP32 scanner
  sends the barcode over WiFi; the backend immediately pushes the product to
  the cashier's screen via WebSocket — zero typing required.

Shared secret auth (X-IoT-Secret):
  The ESP32 cannot easily manage a rotating JWT, but we still need to prevent
  rogue POSTs from the LAN.  A long random shared secret in a header is the
  pragmatic solution for a local-network IoT device.  In production, rotate
  the secret via an OTA config push.

ConnectionManager:
  Tracks active WebSocket connections per store_id.  When a scan arrives for
  store "1", only the POS tabs watching store "1" are notified.  This scales
  naturally to multi-store deployments.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Dict, List

from fastapi import APIRouter, Depends, Header, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.models import Product

logger = logging.getLogger(__name__)

# ── Router ────────────────────────────────────────────────────────────────────
router = APIRouter(prefix="/iot", tags=["IoT Scanner"])

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ScanRequest(BaseModel):
    """Payload sent by the ESP32 firmware via HTTP POST."""
    barcode:   str
    device_id: str
    store_id:  str


class ScanResponse(BaseModel):
    """Response returned to the ESP32 and broadcast to WebSocket clients."""
    barcode:      str
    product_name: str
    unit_price:   float
    stock:        int
    store_id:     str
    scanned_at:   str        # ISO-8601 timestamp


class HealthResponse(BaseModel):
    device_id:  str
    store_id:   str
    ip_address: str
    rssi:       int
    scans:      int
    uptime_s:   int
    firmware:   str
    last_seen:  str


# ── WebSocket Connection Manager ──────────────────────────────────────────────

class ConnectionManager:
    """
    Manages active WebSocket connections grouped by store_id.

    store_id → [WebSocket, WebSocket, ...]

    Multiple cashier tabs (or displays) can connect simultaneously.
    When a scan arrives for store X, all connections in that group receive
    the broadcast.
    """

    def __init__(self):
        # Dict[store_id: str, List[WebSocket]]
        self._connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, store_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.setdefault(store_id, []).append(ws)
        logger.info("WS connect: store=%s  total=%d",
                    store_id, len(self._connections[store_id]))

    def disconnect(self, store_id: str, ws: WebSocket) -> None:
        conns = self._connections.get(store_id, [])
        if ws in conns:
            conns.remove(ws)
        logger.info("WS disconnect: store=%s  remaining=%d", store_id, len(conns))

    async def broadcast(self, store_id: str, message: dict) -> None:
        """Send JSON message to every client watching this store."""
        conns = self._connections.get(store_id, [])
        if not conns:
            logger.debug("WS broadcast: store=%s  no listeners", store_id)
            return

        payload = json.dumps(message)
        dead: List[WebSocket] = []

        for ws in conns:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)

        # Clean up broken connections.
        for ws in dead:
            self.disconnect(store_id, ws)

    def client_count(self, store_id: str) -> int:
        return len(self._connections.get(store_id, []))


# Singleton — shared across all requests in the same process.
manager = ConnectionManager()

# ── In-memory device registry ─────────────────────────────────────────────────
# Tracks the last-seen heartbeat from each device_id.
# In Phase 3, persist this to the database.
_device_registry: Dict[str, dict] = {}


# ── Helper: validate IoT secret ───────────────────────────────────────────────

def _verify_iot_secret(x_iot_secret: str = Header(default="")) -> None:
    """
    Dependency: rejects requests missing the correct X-IoT-Secret header.
    The secret is configured in settings (loaded from .env) to keep it out
    of source code.
    """
    expected = getattr(settings, "IOT_DEVICE_SECRET", "ersis-iot-dev-secret")
    if x_iot_secret != expected:
        logger.warning("IoT auth failed — bad secret from device")
        raise HTTPException(status_code=403, detail="Invalid IoT device secret.")


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/scan", response_model=ScanResponse)
async def receive_scan(
    body: ScanRequest,
    db:   Session = Depends(get_db),
    _:    None    = Depends(_verify_iot_secret),
) -> ScanResponse:
    """
    Called by the ESP32 every time a barcode is successfully scanned.

    1. Look up the product by barcode + store_id.
    2. Build the ScanResponse payload.
    3. Broadcast to all WebSocket clients watching this store.
    4. Return the payload to the ESP32 (for serial/display feedback).
    """
    # ---- Product lookup ----
    product = (
        db.query(Product)
        .filter(
            Product.barcode  == body.barcode,
            Product.store_id == body.store_id,
            Product.is_active == True,
        )
        .first()
    )

    if not product:
        logger.warning("Scan: barcode '%s' not found in store %s",
                       body.barcode, body.store_id)
        raise HTTPException(
            status_code=404,
            detail=f"No product found for barcode '{body.barcode}' in store {body.store_id}."
        )

    # ---- Get current stock ----
    stock_qty = 0
    if product.inventory:
        stock_qty = product.inventory.quantity_in_stock

    # ---- Build response ----
    scanned_at = datetime.now(timezone.utc).isoformat()
    resp = ScanResponse(
        barcode      = body.barcode,
        product_name = product.product_name,
        unit_price   = float(product.unit_price),
        stock        = stock_qty,
        store_id     = body.store_id,
        scanned_at   = scanned_at,
    )

    # ---- Update device registry ----
    _device_registry[body.device_id] = {
        "device_id": body.device_id,
        "store_id":  body.store_id,
        "last_seen": scanned_at,
    }

    # ---- WebSocket broadcast → POS clients ----
    ws_payload = {
        "event":        "BARCODE_SCAN",
        "barcode":      resp.barcode,
        "product_name": resp.product_name,
        "unit_price":   resp.unit_price,
        "stock":        resp.stock,
        "store_id":     resp.store_id,
        "scanned_at":   resp.scanned_at,
        # Include extra fields the POS cart needs:
        "product_id":   str(product.product_id),
        "sku":          product.sku or "",
        "category_id":  str(product.category_id) if product.category_id else "",
    }

    await manager.broadcast(body.store_id, ws_payload)

    logger.info("Scan OK: barcode=%s product='%s' store=%s  ws_clients=%d",
                body.barcode, product.product_name, body.store_id,
                manager.client_count(body.store_id))

    return resp


@router.websocket("/ws/{store_id}")
async def scanner_websocket(store_id: str, websocket: WebSocket) -> None:
    """
    WebSocket endpoint for the POS frontend.

    Connect: ws://localhost:8000/api/v1/iot/ws/1

    Messages received by the client:
      {
        "event":        "BARCODE_SCAN",
        "barcode":      "5901234123457",
        "product_name": "Coca-Cola 500ml",
        "unit_price":   85.0,
        "stock":        42,
        "store_id":     "1",
        "product_id":   "7",
        "sku":          "CC-500",
        "category_id":  "3",
        "scanned_at":   "2026-05-07T15:30:00+00:00"
      }

    The frontend useScannerSocket hook calls addToCart() when it receives
    this event — the product appears instantly on the cashier's screen.
    """
    await manager.connect(store_id, websocket)
    try:
        # Send a connection acknowledgement so the frontend knows it's live.
        await websocket.send_text(json.dumps({
            "event":    "CONNECTED",
            "store_id": store_id,
            "message":  "Scanner WebSocket connected. Waiting for scans...",
        }))
        # Keep the connection open. We don't expect messages FROM the client,
        # but we must receive() to detect disconnects.
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(store_id, websocket)


@router.get("/health")
async def iot_health(
    device_id:  str = "",
    store_id:   str = "",
    ip_address: str = "",
    rssi:       int = 0,
    scans:      int = 0,
    uptime_s:   int = 0,
    firmware:   str = "",
) -> dict:
    """
    Health ping endpoint polled by the ESP32 heartbeat (optional) and
    displayed by the S3IoTDevices settings page.

    The ESP32 calls GET /api/v1/iot/health?device_id=...&store_id=...
    to register its presence without sending a barcode.

    Returns all registered devices for the S3IoTDevices frontend page.
    Status is computed dynamically: a device is 'Online' if its last_seen
    timestamp is within the past 45 seconds, otherwise 'Offline'.
    """
    STALE_THRESHOLD_SECONDS = 45

    if device_id:
        existing = _device_registry.get(device_id, {})
        # Preserve the running scan count — only update if a newer (higher) value arrives
        best_scans = max(existing.get("scans", 0), scans)
        _device_registry[device_id] = {
            "device_id":  device_id,
            "store_id":   store_id   or existing.get("store_id",   ""),
            "ip_address": ip_address or existing.get("ip_address", ""),
            "rssi":       rssi       if rssi  != 0 else existing.get("rssi",     0),
            "scans":      best_scans,
            "uptime_s":   uptime_s   if uptime_s != 0 else existing.get("uptime_s", 0),
            "firmware":   firmware   or existing.get("firmware",   ""),
            "last_seen":  datetime.now(timezone.utc).isoformat(),
        }

    # Annotate each device with a computed status before returning
    now = datetime.now(timezone.utc)
    annotated = []
    for d in _device_registry.values():
        entry = dict(d)
        try:
            last = datetime.fromisoformat(entry["last_seen"])
            age  = (now - last).total_seconds()
            entry["status"] = "Online" if age <= STALE_THRESHOLD_SECONDS else "Offline"
        except Exception:
            entry["status"] = "Offline"
        annotated.append(entry)

    return {
        "ws_connections":    {sid: manager.client_count(sid)
                              for sid in manager._connections
                              if manager.client_count(sid) > 0},
        "registered_devices": annotated,
    }

