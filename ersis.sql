-- ERSIS - Enterprise Retail & Strategic Inventory System

CREATE DATABASE IF NOT EXISTS ersis
	CHARACTER SET  utf8mb4
    COLLATE utf8mb4_unicode_ci;
    
USE ersis;

SET FOREIGN_KEY_CHECKS = 0;

-- T-1 ROLES
-- Defines system roles (shopkeeper, cashier, customer)
CREATE TABLE roles (
	role_id		INT 	NOT NULL AUTO_INCREMENT,
    role_name 	VARCHAR(50) 	NOT NULL,
    description 	TEXT 	NULL,
    created_at		DATETIME 	NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (role_id),
    UNIQUE KEY uq_role_name (role_name)
    ) ENGINE=InnoDB;
    
-- T-02 USERS
-- Central identity table for all system actors.
CREATE TABLE users (
    user_id       INT          NOT NULL AUTO_INCREMENT,
    username      VARCHAR(80)  NOT NULL,
    email         VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,   -- bcrypt hash
    first_name    VARCHAR(80)  NOT NULL,
    last_name     VARCHAR(80)  NULL,
    phone         VARCHAR(20)  NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NULL     ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id),
    UNIQUE KEY uq_username (username),
    UNIQUE KEY uq_email    (email)
) ENGINE=InnoDB;

-- T-03 user_roles  [JUNCTION — ternary: user + role + store]
-- store_id is NOT NULL — use store_id = 1 (system store) for global admins.
-- Soft-revocation: set is_active = FALSE instead of deleting to preserve history.
CREATE TABLE user_roles (
    user_role_id INT      NOT NULL AUTO_INCREMENT,
    user_id      INT      NOT NULL,
    role_id      INT      NOT NULL,
    store_id     INT      NOT NULL,         -- NOT NULL enforced (security fix)
    is_active    BOOLEAN  NOT NULL DEFAULT TRUE,
    assigned_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at   DATETIME NULL,             -- set to NOW() on revocation

    PRIMARY KEY (user_role_id),
    CONSTRAINT fk_ur_user  FOREIGN KEY (user_id)  REFERENCES users  (user_id)  ON DELETE CASCADE,
    CONSTRAINT fk_ur_role  FOREIGN KEY (role_id)  REFERENCES roles  (role_id)  ON DELETE RESTRICT,
    CONSTRAINT fk_ur_store FOREIGN KEY (store_id) REFERENCES stores (store_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- T-04 otp_tokens
-- Stores SHA-256 hashes of time-limited OTP codes for Email-based 2FA.
-- Raw OTP is emailed to the user and NEVER stored; backend hashes the submitted
-- code at verify time and compares against otp_code_hash.
CREATE TABLE otp_tokens (
    token_id      INT         NOT NULL AUTO_INCREMENT,
    user_id       INT         NOT NULL,
    otp_code_hash VARCHAR(64) NOT NULL,   -- SHA-256 hex digest, NOT raw OTP
    purpose       ENUM('login_2fa', 'password_reset', 'email_verification') NOT NULL,
    expires_at    DATETIME    NOT NULL,
    is_used       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (token_id),
    CONSTRAINT fk_otp_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- T-05 · stores (created before user_roles / categories which FK back to it)
-- Represents individual retail stores. store_id = 1 is reserved as the system
-- store for global/superadmin role assignments in user_roles.
CREATE TABLE stores (
    store_id      INT          NOT NULL AUTO_INCREMENT,
    store_name    VARCHAR(150) NOT NULL,
    owner_id      INT          NOT NULL,   -- FK → users
    address       TEXT         NULL,
    contact_email VARCHAR(150) NULL,
    contact_phone VARCHAR(20)  NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (store_id),
    CONSTRAINT fk_store_owner FOREIGN KEY (owner_id)
        REFERENCES users (user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- T-06 categories
-- Store-scoped category hierarchy. NULL store_id = global/system category.
-- UNIQUE(store_id, category_name) allows two different stores to both have
-- a category called "Accessories" independently.
CREATE TABLE categories (
    category_id        INT          NOT NULL AUTO_INCREMENT,
    store_id           INT          NULL,         -- NULL = global system category
    category_name      VARCHAR(100) NOT NULL,
    parent_category_id INT          NULL,         -- self-referencing FK for nesting
    description        TEXT         NULL,

    PRIMARY KEY (category_id),
    UNIQUE KEY uq_store_category (store_id, category_name),
    CONSTRAINT fk_cat_store  FOREIGN KEY (store_id)           REFERENCES stores     (store_id)     ON DELETE CASCADE,
    CONSTRAINT fk_cat_parent FOREIGN KEY (parent_category_id) REFERENCES categories (category_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- T-07 products
-- Master product catalog per store. Barcodes scanned by ESP32 IoT device.
-- UNIQUE(store_id, barcode) allows the same physical barcode across different
-- stores while preventing duplicates within a single store.
CREATE TABLE products (
    product_id      INT           NOT NULL AUTO_INCREMENT,
    store_id        INT           NOT NULL,
    category_id     INT           NULL,
    product_name    VARCHAR(200)  NOT NULL,
    barcode         VARCHAR(100)  NOT NULL,
    description     TEXT          NULL,        -- also used for RAG embedding
    unit_price      DECIMAL(10,2) NOT NULL,
    tax_rate        DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    unit_of_measure VARCHAR(30)   NULL,        -- e.g., kg, litre, piece, box
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NULL     ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (product_id),
    UNIQUE KEY uq_store_barcode (store_id, barcode),
    CONSTRAINT fk_prod_store    FOREIGN KEY (store_id)    REFERENCES stores     (store_id)    ON DELETE RESTRICT,
    CONSTRAINT fk_prod_category FOREIGN KEY (category_id) REFERENCES categories (category_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- T-08 inventory
-- Real-time stock levels per product per store. store_id is intentional
-- denormalization (derivable via products.store_id) kept for query performance.
-- UNIQUE(product_id) enforces one inventory record per product.
CREATE TABLE inventory (
    inventory_id    INT      NOT NULL AUTO_INCREMENT,
    product_id      INT      NOT NULL,
    store_id        INT      NOT NULL,   -- intentional denorm; kept in sync by app
    quantity_in_stock INT    NOT NULL DEFAULT 0,
    reorder_level   INT      NULL,
    last_restocked_at DATETIME NULL,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (inventory_id),
    UNIQUE KEY uq_product_inventory (product_id, store_id),
    CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE RESTRICT,
    CONSTRAINT fk_inv_store   FOREIGN KEY (store_id)   REFERENCES stores   (store_id)   ON DELETE RESTRICT
) ENGINE=InnoDB;

-- T-09 suppliers
CREATE TABLE suppliers (
    supplier_id    INT          NOT NULL AUTO_INCREMENT,
    supplier_name  VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NULL,
    email          VARCHAR(150) NULL,
    phone          VARCHAR(20)  NULL,
    address        TEXT         NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (supplier_id)
) ENGINE=InnoDB;

-- T-10 product_suppliers  [JUNCTION — M-M: products ↔ suppliers]
-- UNIQUE(product_id, supplier_id) prevents duplicate supplier-product pairs,
-- which would make supply_price ambiguous.
CREATE TABLE product_suppliers (
    product_supplier_id INT           NOT NULL AUTO_INCREMENT,
    product_id          INT           NOT NULL,
    supplier_id         INT           NOT NULL,
    supply_price        DECIMAL(10,2) NULL,
    lead_time_days      INT           NULL,
    is_preferred        BOOLEAN       NOT NULL DEFAULT FALSE,

    PRIMARY KEY (product_supplier_id),
    UNIQUE KEY uq_product_supplier (product_id, supplier_id),
    CONSTRAINT fk_ps_product  FOREIGN KEY (product_id)  REFERENCES products  (product_id)  ON DELETE CASCADE,
    CONSTRAINT fk_ps_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (supplier_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- T-26 · refresh_tokens
-- JWT refresh token registry. token_hash is stored (never raw) so a DB leak
-- cannot be used to forge sessions. revoked_at enables logout-before-expiry.
CREATE TABLE refresh_tokens (
    token_id    INT          NOT NULL AUTO_INCREMENT,
    user_id     INT          NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,
    device_info VARCHAR(255) NULL,
    ip_address  VARCHAR(45)  NULL,         -- VARCHAR(45) supports IPv6
    expires_at  DATETIME     NOT NULL,
    revoked_at  DATETIME     NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (token_id),
    UNIQUE KEY uq_token_hash (token_hash),
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- T-34 · user_device_tokens
-- FCM / APNs push notification tokens per device.
-- UNIQUE(user_id, device_token) prevents duplicate push notifications on re-login.
-- last_used_at tracks token freshness for stale-token cleanup.
CREATE TABLE user_device_tokens (
    token_id     INT          NOT NULL AUTO_INCREMENT,
    user_id      INT          NOT NULL,
    device_token VARCHAR(500) NOT NULL,
    platform     ENUM('android', 'ios') NOT NULL,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    last_used_at DATETIME     NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (token_id),
    UNIQUE KEY uq_user_device_token (user_id, device_token),
    CONSTRAINT fk_udt_user FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- T-27 · product_price_history
-- Immutable audit trail of every price change. old_price/new_price captured
-- on every UPDATE to products.unit_price via application logic.
CREATE TABLE product_price_history (
    price_history_id INT           NOT NULL AUTO_INCREMENT,
    product_id       INT           NOT NULL,
    old_price        DECIMAL(10,2) NOT NULL,
    new_price        DECIMAL(10,2) NOT NULL,
    changed_by       INT           NOT NULL,   -- FK → users
    reason           VARCHAR(255)  NULL,
    changed_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (price_history_id),
    CONSTRAINT fk_pph_product FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT fk_pph_user    FOREIGN KEY (changed_by) REFERENCES users    (user_id)    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- T-32 · product_images
-- Stores multiple image URLs per product for React / React Native display.
-- is_primary flag marks the main listing image (enforced as one-per-product
-- by application logic).
CREATE TABLE product_images (
    image_id      INT          NOT NULL AUTO_INCREMENT,
    product_id    INT          NOT NULL,
    image_url     VARCHAR(500) NOT NULL,
    alt_text      VARCHAR(255) NULL,
    is_primary    BOOLEAN      NOT NULL DEFAULT FALSE,
    display_order INT          NOT NULL DEFAULT 0,
    uploaded_by   INT          NULL,           -- FK → users
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (image_id),
    CONSTRAINT fk_pi_product FOREIGN KEY (product_id)  REFERENCES products (product_id) ON DELETE CASCADE,
    CONSTRAINT fk_pi_user    FOREIGN KEY (uploaded_by) REFERENCES users    (user_id)    ON DELETE SET NULL
) ENGINE=InnoDB;

-- T-28 · inventory_logs
-- Append-only stock movement ledger. BIGINT PK for high-volume inserts.
-- product_id and store_id are intentional denormalization for fast AI forecasting
-- queries that need product+store+date without multi-table JOINs.
CREATE TABLE inventory_logs (
    log_id          INT   NOT NULL AUTO_INCREMENT,
    inventory_id    INT      NOT NULL,
    product_id      INT      NOT NULL,   -- denorm; FK for query index
    store_id        INT      NOT NULL,   -- denorm; FK for query index
    movement_type   ENUM('sale', 'restock', 'adjustment', 'damage', 'return') NOT NULL,
    quantity_change INT      NOT NULL,   -- signed: positive = in, negative = out
    quantity_before INT      NOT NULL,
    quantity_after  INT      NOT NULL,
    reference_type  ENUM('transaction', 'manual', 'return') NULL,
    reference_id    INT      NULL,       -- PK of triggering record
    notes           TEXT     NULL,
    performed_by    INT      NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (log_id),
    CONSTRAINT fk_il_inventory   FOREIGN KEY (inventory_id) REFERENCES inventory (inventory_id) ON DELETE RESTRICT,
    CONSTRAINT fk_il_product     FOREIGN KEY (product_id)   REFERENCES products  (product_id)   ON DELETE RESTRICT,
    CONSTRAINT fk_il_store       FOREIGN KEY (store_id)     REFERENCES stores    (store_id)      ON DELETE RESTRICT,
    CONSTRAINT fk_il_performed   FOREIGN KEY (performed_by) REFERENCES users     (user_id)       ON DELETE RESTRICT
) ENGINE=InnoDB;

-- T-22 · guest_customers
-- Lightweight record for walk-in buyers who don't have an account.
-- All fields optional — cashier captures only what the customer provides.
CREATE TABLE guest_customers (
    guest_id   INT          NOT NULL AUTO_INCREMENT,
    name       VARCHAR(150) NULL,
    phone      VARCHAR(20)  NULL,
    email      VARCHAR(150) NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (guest_id)
) ENGINE=InnoDB;

-- T-29 · discounts
-- Discount rules scoped to a whole transaction, a specific product, or a
-- category. product_id / category_id are populated based on applies_to value;
-- the CHECK constraint enforces mutual exclusivity.
CREATE TABLE discounts (
    discount_id        INT           NOT NULL AUTO_INCREMENT,
    store_id           INT           NOT NULL,
    discount_name      VARCHAR(150)  NOT NULL,
    discount_type      ENUM('percentage', 'fixed_amount') NOT NULL,
    discount_value     DECIMAL(10,2) NOT NULL,
    applies_to         ENUM('transaction', 'product', 'category') NOT NULL,
    product_id         INT           NULL,   -- set when applies_to = 'product'
    category_id        INT           NULL,   -- set when applies_to = 'category'
    min_purchase_amount DECIMAL(10,2) NULL,
    valid_from         DATE          NULL,
    valid_until        DATE          NULL,
    is_active          BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (discount_id),
    -- Enforce applies_to ↔ FK consistency
    CONSTRAINT chk_discount_scope CHECK (
        (applies_to = 'product'     AND product_id  IS NOT NULL AND category_id IS NULL) OR
        (applies_to = 'category'    AND category_id IS NOT NULL AND product_id  IS NULL) OR
        (applies_to = 'transaction' AND product_id  IS NULL     AND category_id IS NULL)
    ),
    CONSTRAINT fk_disc_store    FOREIGN KEY (store_id)    REFERENCES stores     (store_id)     ON DELETE RESTRICT,
    CONSTRAINT fk_disc_product  FOREIGN KEY (product_id)  REFERENCES products   (product_id)   ON DELETE CASCADE,
    CONSTRAINT fk_disc_category FOREIGN KEY (category_id) REFERENCES categories (category_id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- T-11 transactions
-- Bill/invoice header. Supports three buyer types:
--   1. Registered customer  → customer_id IS NOT NULL, guest_customer_id IS NULL
--   2. Guest with contact   → customer_id IS NULL,     guest_customer_id IS NOT NULL
--   3. Fully anonymous      → both NULL
-- invoice_number is UNIQUE per store (not globally) to support independent
-- per-store numbering sequences.
CREATE TABLE transactions (
    transaction_id   INT           NOT NULL AUTO_INCREMENT,
    invoice_number   VARCHAR(50)   NOT NULL,
    store_id         INT           NOT NULL,
    cashier_id       INT           NOT NULL,
    customer_id      INT           NULL,    -- FK → users (registered buyer)
    guest_customer_id INT          NULL,    -- FK → guest_customers (walk-in)
    transaction_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    subtotal         DECIMAL(12,2) NOT NULL,
    tax_amount       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount     DECIMAL(12,2) NOT NULL,
    status           ENUM('pending', 'completed', 'refunded', 'cancelled') NOT NULL DEFAULT 'pending',
    updated_at       DATETIME      NULL     ON UPDATE CURRENT_TIMESTAMP,
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (transaction_id),
    UNIQUE KEY uq_store_invoice (store_id, invoice_number),
    
    CONSTRAINT fk_txn_store         FOREIGN KEY (store_id)          REFERENCES stores          (store_id)  ON DELETE RESTRICT,
    CONSTRAINT fk_txn_cashier       FOREIGN KEY (cashier_id)        REFERENCES users           (user_id)   ON DELETE RESTRICT,
    CONSTRAINT fk_txn_customer      FOREIGN KEY (customer_id)       REFERENCES users           (user_id)   ON DELETE SET NULL,
    CONSTRAINT fk_txn_guest         FOREIGN KEY (guest_customer_id) REFERENCES guest_customers (guest_id)  ON DELETE SET NULL
) ENGINE=InnoDB;

-- T-12 · transaction_items
-- Line items per transaction. unit_price_at_sale is intentionally denormalized —
-- it snapshots the price at the moment of sale so historical invoices remain
-- accurate even when products.unit_price changes later.
-- discount_id links to the product/category discount rule that was applied
-- (NULL if no discount fired on this line).
CREATE TABLE transaction_items (
    item_id             INT           NOT NULL AUTO_INCREMENT,
    transaction_id      INT           NOT NULL,
    product_id          INT           NOT NULL,
    quantity            INT           NOT NULL,
    unit_price_at_sale  DECIMAL(10,2) NOT NULL,   -- snapshot at time of sale
    discount_id         INT           NULL,         -- FK → discounts (product/category scope)
    discount            DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- computed amount stored for immutability
    line_total          DECIMAL(12,2) NOT NULL,   -- (qty × unit_price) − discount

    PRIMARY KEY (item_id),
    
    UNIQUE KEY uq_txn_product (transaction_id, product_id),
    
    CONSTRAINT fk_ti_transaction FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id) ON DELETE CASCADE,
    CONSTRAINT fk_ti_product     FOREIGN KEY (product_id)     REFERENCES products     (product_id)     ON DELETE RESTRICT,
    CONSTRAINT fk_ti_discount    FOREIGN KEY (discount_id)    REFERENCES discounts    (discount_id)    ON DELETE SET NULL
) ENGINE=InnoDB;

-- T-33 · transaction_discounts  [JUNCTION — M-M: transactions ↔ discounts]
-- Tracks transaction-level discount rules applied to a bill.
-- UNIQUE(transaction_id, discount_id) prevents the same promotion being
-- double-applied to a single bill (race condition / retry guard).
CREATE TABLE transaction_discounts (
    id             INT           NOT NULL AUTO_INCREMENT,
    transaction_id INT           NOT NULL,
    discount_id    INT           NOT NULL,
    applied_amount DECIMAL(10,2) NOT NULL,   -- actual NPR deducted (may differ from discount_value)
    applied_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_txn_discount (transaction_id, discount_id),
    CONSTRAINT fk_td_transaction FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id) ON DELETE CASCADE,
    CONSTRAINT fk_td_discount    FOREIGN KEY (discount_id)    REFERENCES discounts    (discount_id)    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- T-30 · refund_items
-- Itemised return details. Two FKs to transactions:
--   original_transaction_id → the bill being refunded
--   refund_transaction_id   → the new refund bill (status = 'refunded')
-- Supports partial returns (only specific products from a bill).
CREATE TABLE refund_items (
    refund_id              INT           NOT NULL AUTO_INCREMENT,
    original_transaction_id INT          NOT NULL,
    refund_transaction_id  INT           NOT NULL,
    product_id             INT           NOT NULL,
    quantity_returned      INT           NOT NULL,
    refund_amount          DECIMAL(10,2) NOT NULL,
    reason                 ENUM('defective', 'wrong_item', 'customer_change_mind', 'other') NOT NULL,
    notes                  TEXT          NULL,
    processed_by           INT           NOT NULL,
    created_at             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (refund_id),
    CONSTRAINT fk_ri_orig_txn   FOREIGN KEY (original_transaction_id) REFERENCES transactions (transaction_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ri_refund_txn FOREIGN KEY (refund_transaction_id)   REFERENCES transactions (transaction_id) ON DELETE RESTRICT,
    CONSTRAINT fk_ri_product    FOREIGN KEY (product_id)              REFERENCES products     (product_id)     ON DELETE RESTRICT,
    CONSTRAINT fk_ri_processed  FOREIGN KEY (processed_by)            REFERENCES users        (user_id)        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- T-13 · payments
-- Records payment method and status per transaction.
-- One transaction can have multiple payment rows (split payment support).
CREATE TABLE payments (
    payment_id        INT           NOT NULL AUTO_INCREMENT,
    transaction_id    INT           NOT NULL,
    payment_method    ENUM('cash', 'card') NOT NULL,
    amount            DECIMAL(12,2) NOT NULL,
    payment_status    ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    payment_reference VARCHAR(100)  NULL,   -- card terminal receipt number etc.
    paid_at           DATETIME      NULL,

    PRIMARY KEY (payment_id),
    CONSTRAINT fk_pay_transaction FOREIGN KEY (transaction_id)
        REFERENCES transactions (transaction_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- T-16 · iot_devices
-- Registry of ESP32 barcode scanner devices and their MQTT credentials.
CREATE TABLE iot_devices (
    device_id         INT          NOT NULL AUTO_INCREMENT,
    store_id          INT          NOT NULL,
    device_identifier VARCHAR(100) NOT NULL,   -- static hardware ID in MQTT payload
    device_type       VARCHAR(50)  NOT NULL,    -- e.g., ESP32_BARCODE_SCANNER
    mqtt_username     VARCHAR(100) NULL,
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    registered_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at      DATETIME     NULL,

    PRIMARY KEY (device_id),
    UNIQUE KEY uq_device_identifier (device_identifier),
    UNIQUE KEY uq_mqtt_username     (mqtt_username),
    CONSTRAINT fk_iot_store FOREIGN KEY (store_id)
        REFERENCES stores (store_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- T-17 · scan_logs
-- Raw log of every barcode scan event received from IoT devices via MQTT.
-- BIGINT PK — highest write-frequency table in the system.
CREATE TABLE scan_logs (
    scan_id        BIGINT       NOT NULL AUTO_INCREMENT,
    device_id      INT          NOT NULL,
    barcode_value  VARCHAR(150) NOT NULL,
    scan_timestamp DATETIME     NOT NULL,
    transaction_id INT          NULL,   -- linked once scan is processed
    status         ENUM('received', 'processed', 'failed') NOT NULL DEFAULT 'received',

    PRIMARY KEY (scan_id),
    CONSTRAINT fk_sl_device      FOREIGN KEY (device_id)      REFERENCES iot_devices  (device_id)      ON DELETE RESTRICT,
    CONSTRAINT fk_sl_transaction FOREIGN KEY (transaction_id) REFERENCES transactions (transaction_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- T-18 · sales_forecasts
-- Persists scikit-learn regression model predictions per product per day.
-- rmse_score and mae_score track model quality (target error rate < 15%).
CREATE TABLE sales_forecasts (
    forecast_id        INT           NOT NULL AUTO_INCREMENT,
    store_id           INT           NOT NULL,
    product_id         INT           NOT NULL,
    forecast_date      DATE          NOT NULL,
    predicted_quantity DECIMAL(10,2) NOT NULL,
    rmse_score         DECIMAL(10,4) NULL,
    mae_score          DECIMAL(10,4) NULL,
    model_version      VARCHAR(50)   NULL,
    generated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (forecast_id),
    CONSTRAINT fk_sf_store   FOREIGN KEY (store_id)   REFERENCES stores   (store_id)   ON DELETE CASCADE,
    CONSTRAINT fk_sf_product FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- T-19 · chatbot_sessions
-- Groups chatbot messages into sessions. access_level is resolved from the
-- user's highest role at session creation — decoupled from role names so
-- renaming a role never breaks chatbot access control.
CREATE TABLE chatbot_sessions (
    session_id   INT      NOT NULL AUTO_INCREMENT,
    user_id      INT      NULL,   -- NULL for anonymous / guest sessions
    store_id     INT      NOT NULL,
    access_level ENUM('public', 'staff', 'admin') NOT NULL,
    started_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at     DATETIME NULL,

    PRIMARY KEY (session_id),
    CONSTRAINT fk_cs_user  FOREIGN KEY (user_id)  REFERENCES users  (user_id)  ON DELETE SET NULL,
    CONSTRAINT fk_cs_store FOREIGN KEY (store_id) REFERENCES stores (store_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- T-20 · chatbot_messages
-- Individual messages within a chatbot session. retrieved_context stores
-- the RAG chunks as a JSON array for traceability.
CREATE TABLE chatbot_messages (
    message_id        INT      NOT NULL AUTO_INCREMENT,
    session_id        INT      NOT NULL,
    sender_type       ENUM('user', 'bot') NOT NULL,
    message_text      TEXT     NOT NULL,
    retrieved_context TEXT     NULL,   -- JSON array of RAG chunk IDs / text used
    sent_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (message_id),
    CONSTRAINT fk_cm_session FOREIGN KEY (session_id)
        REFERENCES chatbot_sessions (session_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- T-21 · audit_logs
-- Immutable security log of all system actions. BIGINT PK for high volume.
-- entity_id is BIGINT to match BIGINT PKs in inventory_logs and scan_logs.
-- old_value / new_value stored as JSON to cover any entity type without
-- per-entity audit tables.
CREATE TABLE audit_logs (
    log_id      INT       NOT NULL AUTO_INCREMENT,
    user_id     INT          NULL,   -- NULL for system/automated actions
    store_id    INT          NULL,   -- NULL for global actions
    action      VARCHAR(100) NOT NULL,   -- e.g., LOGIN, CREATE_PRODUCT, VOID_TRANSACTION
    entity_type VARCHAR(50)  NULL,       -- table name affected
    entity_id   BIGINT       NULL,       -- PK of affected record (BIGINT for high-vol tables)
    old_value   JSON         NULL,
    new_value   JSON         NULL,
    ip_address  VARCHAR(45)  NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (log_id),
    CONSTRAINT fk_al_user  FOREIGN KEY (user_id)  REFERENCES users  (user_id)  ON DELETE SET NULL,
    CONSTRAINT fk_al_store FOREIGN KEY (store_id) REFERENCES stores (store_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- T-23 · rag_document_chunks
-- Bridge table linking MySQL source records to FAISS vector embeddings.
-- access_level controls which chunks are returned per chatbot session role.
-- faiss_index_id links each row to its position in the FAISS flat index.
-- If the FAISS volume is lost, the index can be rebuilt by re-embedding chunk_text.
CREATE TABLE rag_document_chunks (
    chunk_id        INT          NOT NULL AUTO_INCREMENT,
    store_id        INT          NOT NULL,
    source_type     ENUM('product', 'store_policy', 'faq', 'inventory_summary', 'sales_analytics') NOT NULL,
    access_level    ENUM('public', 'staff', 'admin') NOT NULL,
    source_id       INT          NULL,   -- logical FK — target depends on source_type
    chunk_text      TEXT         NOT NULL,
    faiss_index_id  BIGINT       NULL,
    embedding_model VARCHAR(100) NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NULL     ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (chunk_id),
    CONSTRAINT fk_rdc_store FOREIGN KEY (store_id)
        REFERENCES stores (store_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- T-24 · store_faqs
-- FAQ question-answer pairs per store. Editable source of truth for
-- faq chunks embedded into FAISS (source_type = 'faq').
CREATE TABLE store_faqs (
    faq_id     INT          NOT NULL AUTO_INCREMENT,
    store_id   INT          NOT NULL,
    question   VARCHAR(500) NOT NULL,
    answer     TEXT         NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NULL     ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (faq_id),
    CONSTRAINT fk_sf_faqs_store FOREIGN KEY (store_id)
        REFERENCES stores (store_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- T-25 · store_policies
-- Policy documents per store. access_level is inherited by rag_document_chunks
-- when the policy is embedded — shopkeeper sets it once here.
CREATE TABLE store_policies (
    policy_id   INT          NOT NULL AUTO_INCREMENT,
    store_id    INT          NOT NULL,
    policy_name VARCHAR(150) NOT NULL,
    content     TEXT         NOT NULL,
    access_level ENUM('public', 'staff', 'admin') NOT NULL DEFAULT 'public',
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NULL     ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (policy_id),
    CONSTRAINT fk_sp_store FOREIGN KEY (store_id)
        REFERENCES stores (store_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- T-35 · purchase_orders
-- Records restock orders placed with suppliers. received_date is set when
-- goods arrive, triggering inventory_logs entries (movement_type = 'restock').
CREATE TABLE purchase_orders (
    order_id      INT      NOT NULL AUTO_INCREMENT,
    store_id      INT      NOT NULL,
    supplier_id   INT      NOT NULL,
    ordered_by    INT      NOT NULL,   -- shopkeeper / inventory manager
    status        ENUM('pending', 'received', 'partial', 'cancelled') NOT NULL DEFAULT 'pending',
    order_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_date DATE     NULL,
    received_date DATETIME NULL,
    notes         TEXT     NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (order_id),
    CONSTRAINT fk_po_store    FOREIGN KEY (store_id)   REFERENCES stores    (store_id)    ON DELETE RESTRICT,
    CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (supplier_id) ON DELETE RESTRICT,
    CONSTRAINT fk_po_user     FOREIGN KEY (ordered_by)  REFERENCES users     (user_id)     ON DELETE RESTRICT
) ENGINE=InnoDB;

-- T-36 · purchase_order_items
-- Line items per purchase order. quantity_received supports partial deliveries
-- (e.g., ordered 100 units, received 60 — status becomes 'partial').
-- unit_cost is snapshotted at order time (supplier price may change later).
CREATE TABLE purchase_order_items (
    item_id           INT           NOT NULL AUTO_INCREMENT,
    order_id          INT           NOT NULL,
    product_id        INT           NOT NULL,
    quantity_ordered  INT           NOT NULL,
    unit_cost         DECIMAL(10,2) NOT NULL,   -- snapshot at order time
    quantity_received INT           NULL,         -- NULL until delivery

    PRIMARY KEY (item_id),
    CONSTRAINT fk_poi_order   FOREIGN KEY (order_id)   REFERENCES purchase_orders (order_id)    ON DELETE CASCADE,
    CONSTRAINT fk_poi_product FOREIGN KEY (product_id) REFERENCES products        (product_id)  ON DELETE RESTRICT
) ENGINE=InnoDB;

-- T-31 · notifications
-- Tracks all sent notifications across all channels (email, in_app, SMS).
-- reference_type + reference_id identify the triggering entity polymorphically
-- (e.g., reference_type = 'transaction', reference_id = 42).
CREATE TABLE notifications (
    notification_id   INT          NOT NULL AUTO_INCREMENT,
    user_id           INT          NULL,   -- NULL for guest receipt notifications
    store_id          INT          NULL,
    notification_type ENUM('low_stock_alert', 'transaction_receipt', 'otp', 'refund_processed', 'system_alert') NOT NULL,
    channel           ENUM('email', 'in_app', 'sms') NOT NULL,
    subject           VARCHAR(255) NULL,
    body              TEXT         NOT NULL,
    status            ENUM('pending', 'sent', 'failed', 'read') NOT NULL DEFAULT 'pending',
    reference_type    VARCHAR(50)  NULL,   -- e.g., 'transaction', 'inventory', 'refund'
    reference_id      INT          NULL,
    sent_at           DATETIME     NULL,
    read_at           DATETIME     NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (notification_id),
    CONSTRAINT fk_notif_user  FOREIGN KEY (user_id)  REFERENCES users  (user_id)  ON DELETE SET NULL,
    CONSTRAINT fk_notif_store FOREIGN KEY (store_id) REFERENCES stores (store_id) ON DELETE SET NULL
) ENGINE=InnoDB;

