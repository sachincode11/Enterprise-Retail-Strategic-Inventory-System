from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)

from sqlalchemy.orm import relationship

from app.database import Base

from app.models.enums import *

# Role 1
class Role(Base):
    __tablename__ = "roles"

    role_id     = Column(Integer,    primary_key=True, autoincrement=True)
    role_name   = Column(String(50), nullable=False, unique=True)
    description = Column(Text,       nullable=True)
    created_at  = Column(DateTime,   nullable=False, server_default=func.now())

    user_roles = relationship("UserRole", back_populates="role")

# User 2
class User(Base):
    __tablename__ = "users"

    user_id       = Column(Integer, primary_key=True, autoincrement=True)
    username      = Column(String(80), nullable=False, unique=True)
    email         = Column(String(150), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    first_name    = Column(String(80),  nullable=False)
    last_name     = Column(String(80),  nullable=True)
    phone         = Column(String(20),  nullable=True)
    is_active     = Column(Boolean,     nullable=False, default=True)
    created_at    = Column(DateTime,    nullable=False, server_default=func.now())
    updated_at    = Column(DateTime,    nullable=True,  onupdate=func.now())

    user_roles            = relationship("UserRole",           back_populates="user",              foreign_keys="UserRole.user_id")
    owned_stores          = relationship("Store",              back_populates="owner",             foreign_keys="Store.owner_id")
    otp_tokens            = relationship("OTPToken",           back_populates="user")
    refresh_tokens        = relationship("RefreshToken",       back_populates="user")
    device_tokens         = relationship("UserDeviceToken",    back_populates="user")
    cashier_transactions  = relationship("Transaction",        back_populates="cashier",           foreign_keys="Transaction.cashier_id")
    customer_transactions = relationship("Transaction",        back_populates="customer",          foreign_keys="Transaction.customer_id")
    price_changes         = relationship("ProductPriceHistory",back_populates="changed_by_user",   foreign_keys="ProductPriceHistory.changed_by")
    uploaded_images       = relationship("ProductImage",       back_populates="uploader",          foreign_keys="ProductImage.uploaded_by")
    inventory_logs        = relationship("InventoryLog",       back_populates="performed_by_user", foreign_keys="InventoryLog.performed_by")
    purchase_orders       = relationship("PurchaseOrder",      back_populates="ordered_by_user",   foreign_keys="PurchaseOrder.ordered_by")
    refunds_processed     = relationship("RefundItem",         back_populates="processed_by_user", foreign_keys="RefundItem.processed_by")
    notifications         = relationship("Notification",       back_populates="user")
    audit_logs            = relationship("AuditLog",           back_populates="user")
    chatbot_sessions      = relationship("ChatbotSession",     back_populates="user")

# Store 3
class Store(Base):
    __tablename__ = "stores"

    store_id      = Column(Integer,     primary_key=True, autoincrement=True)
    store_name    = Column(String(150), nullable=False)
    owner_id      = Column(Integer,     ForeignKey("users.user_id", ondelete="RESTRICT"), nullable=False)
    address       = Column(Text,        nullable=True)
    contact_email = Column(String(150), nullable=True)
    contact_phone = Column(String(20),  nullable=True)
    is_active     = Column(Boolean,     nullable=False, default=True)
    created_at    = Column(DateTime,    nullable=False, server_default=func.now())

    owner            = relationship("User",             back_populates="owned_stores",    foreign_keys=[owner_id])
    user_roles       = relationship("UserRole",         back_populates="store")
    categories       = relationship("Category",         back_populates="store")
    products         = relationship("Product",          back_populates="store")
    inventory_items  = relationship("Inventory",        back_populates="store")
    discounts        = relationship("Discount",         back_populates="store")
    transactions     = relationship("Transaction",      back_populates="store")
    purchase_orders  = relationship("PurchaseOrder",    back_populates="store")
    iot_devices      = relationship("IoTDevice",        back_populates="store")
    suppliers        = relationship("Supplier",         back_populates="store")
    sales_forecasts  = relationship("SalesForecast",    back_populates="store")
    chatbot_sessions = relationship("ChatbotSession",   back_populates="store")
    audit_logs       = relationship("AuditLog",         back_populates="store")
    rag_chunks       = relationship("RAGDocumentChunk", back_populates="store")
    faqs             = relationship("StoreFAQ",         back_populates="store")
    policies         = relationship("StorePolicy",      back_populates="store")
    notifications    = relationship("Notification",     back_populates="store")
    inventory_logs   = relationship("InventoryLog",     back_populates="store")

# User ↔ Role ↔ Store  (RBAC junction) 4
class UserRole(Base):
    __tablename__ = "user_roles"

    user_role_id = Column(Integer,  primary_key=True, autoincrement=True)
    user_id      = Column(Integer,  ForeignKey("users.user_id",   ondelete="CASCADE"),  nullable=False)
    role_id      = Column(Integer,  ForeignKey("roles.role_id",   ondelete="RESTRICT"), nullable=False)
    store_id     = Column(Integer,  ForeignKey("stores.store_id", ondelete="RESTRICT"), nullable=False)
    is_active    = Column(Boolean,  nullable=False, default=True)
    assigned_at  = Column(DateTime, nullable=False, server_default=func.now())
    revoked_at   = Column(DateTime, nullable=True)

    user  = relationship("User",  back_populates="user_roles", foreign_keys=[user_id])
    role  = relationship("Role",  back_populates="user_roles")
    store = relationship("Store", back_populates="user_roles")

# OTP Token  (2FA + password reset) 5
class OTPToken(Base):
    __tablename__ = "otp_tokens"

    token_id      = Column(Integer,  primary_key=True, autoincrement=True)
    user_id       = Column(Integer,  ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    otp_code_hash = Column(String(64), nullable=False)
    purpose       = Column(Enum(OTPPurpose), nullable=False)
    expires_at    = Column(DateTime, nullable=False)
    is_used       = Column(Boolean,  nullable=False, default=False)
    created_at    = Column(DateTime, nullable=False, server_default=func.now())

    user = relationship("User", back_populates="otp_tokens")

# Refresh Token 6
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    token_id    = Column(Integer,     primary_key=True, autoincrement=True)
    user_id     = Column(Integer,     ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    token_hash  = Column(String(255), nullable=False, unique=True)
    device_info = Column(String(255), nullable=True)
    ip_address  = Column(String(45),  nullable=True)
    expires_at  = Column(DateTime,    nullable=False)
    revoked_at  = Column(DateTime,    nullable=True)
    created_at  = Column(DateTime,    nullable=False, server_default=func.now())

    user = relationship("User", back_populates="refresh_tokens")

# Store FAQ 7
class StoreFAQ(Base):
    __tablename__ = "store_faqs"

    faq_id     = Column(Integer,     primary_key=True, autoincrement=True)
    store_id   = Column(Integer,     ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    question   = Column(String(500), nullable=False)
    answer     = Column(Text,        nullable=False)
    is_active  = Column(Boolean,     nullable=False, default=True)
    created_at = Column(DateTime,    nullable=False, server_default=func.now())
    updated_at = Column(DateTime,    nullable=True,  onupdate=func.now())

    store = relationship("Store", back_populates="faqs")

# Store Policy 8
class StorePolicy(Base):
    __tablename__ = "store_policies"

    policy_id    = Column(Integer,     primary_key=True, autoincrement=True)
    store_id     = Column(Integer,     ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    policy_name  = Column(String(150), nullable=False)
    content      = Column(Text,        nullable=False)
    access_level = Column(Enum(PolicyAccessLevel), nullable=False, default=PolicyAccessLevel.public)
    is_active    = Column(Boolean,     nullable=False, default=True)
    created_at   = Column(DateTime,    nullable=False, server_default=func.now())
    updated_at   = Column(DateTime,    nullable=True,  onupdate=func.now())

    store = relationship("Store", back_populates="policies")

# Guest Customer  (unauthenticated checkout) 9
class GuestCustomer(Base):
    __tablename__ = "guest_customers"

    guest_id   = Column(Integer,     primary_key=True, autoincrement=True)
    name       = Column(String(150), nullable=True)
    phone      = Column(String(20),  nullable=True)
    email      = Column(String(150), nullable=True)
    created_at = Column(DateTime,    nullable=False, server_default=func.now())

    transactions = relationship("Transaction", back_populates="guest_customer")


# Discount 10
class Discount(Base):
    __tablename__ = "discounts"

    discount_id         = Column(Integer,       primary_key=True, autoincrement=True)
    store_id            = Column(Integer,       ForeignKey("stores.store_id",        ondelete="RESTRICT"), nullable=False)
    discount_name       = Column(String(150),   nullable=False)
    discount_type       = Column(Enum(DiscountType), nullable=False)
    discount_value      = Column(Numeric(10,2), nullable=False)
    applies_to          = Column(Enum(DiscountAppliesTo),    nullable=False)
    product_id          = Column(Integer,       ForeignKey("products.product_id",    ondelete="CASCADE"),  nullable=True)
    category_id         = Column(Integer,       ForeignKey("categories.category_id", ondelete="CASCADE"),  nullable=True)
    min_purchase_amount = Column(Numeric(10,2), nullable=True)
    valid_from          = Column(Date,          nullable=True)
    valid_until         = Column(Date,          nullable=True)
    is_active           = Column(Boolean,       nullable=False, default=True)
    created_at          = Column(DateTime,      nullable=False, server_default=func.now())

    store                 = relationship("Store",               back_populates="discounts")
    product               = relationship("Product",             back_populates="discounts")
    category              = relationship("Category",            back_populates="discounts")
    transaction_items     = relationship("TransactionItem",     back_populates="discount_ref")
    transaction_discounts = relationship("TransactionDiscount", back_populates="discount")

# Transaction  (a completed / pending sale) 11
class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        UniqueConstraint("store_id", "invoice_number", name="uq_store_invoice"),
    )

    transaction_id    = Column(Integer,       primary_key=True, autoincrement=True)
    invoice_number    = Column(String(50),    nullable=False)
    store_id          = Column(Integer,       ForeignKey("stores.store_id",          ondelete="RESTRICT"), nullable=False)
    cashier_id        = Column(Integer,       ForeignKey("users.user_id",            ondelete="RESTRICT"), nullable=False)
    customer_id       = Column(Integer,       ForeignKey("users.user_id",            ondelete="SET NULL"), nullable=True)
    guest_customer_id = Column(Integer,       ForeignKey("guest_customers.guest_id", ondelete="SET NULL"), nullable=True)
    transaction_date  = Column(DateTime,      nullable=False, server_default=func.now())
    subtotal          = Column(Numeric(12,2), nullable=False)
    tax_amount        = Column(Numeric(10,2), nullable=False, default=0.00)
    discount_amount   = Column(Numeric(10,2), nullable=False, default=0.00)
    total_amount      = Column(Numeric(12,2), nullable=False)
    status            = Column(Enum(TransactionStatus), nullable=False, default=TransactionStatus.pending)
    updated_at        = Column(DateTime,      nullable=True,  onupdate=func.now())
    created_at        = Column(DateTime,      nullable=False, server_default=func.now())

    store                 = relationship("Store",               back_populates="transactions")
    cashier               = relationship("User",                back_populates="cashier_transactions",  foreign_keys=[cashier_id])
    customer              = relationship("User",                back_populates="customer_transactions", foreign_keys=[customer_id])
    guest_customer        = relationship("GuestCustomer",       back_populates="transactions")
    items                 = relationship("TransactionItem",     back_populates="transaction",           cascade="all, delete-orphan")
    transaction_discounts = relationship("TransactionDiscount", back_populates="transaction",           cascade="all, delete-orphan")
    payments              = relationship("Payment",             back_populates="transaction",           cascade="all, delete-orphan")
    scan_logs             = relationship("ScanLog",             back_populates="matched_transaction")
    original_refunds      = relationship("RefundItem",          back_populates="original_transaction",  foreign_keys="RefundItem.original_transaction_id")
    refund_transactions   = relationship("RefundItem",          back_populates="refund_transaction",    foreign_keys="RefundItem.refund_transaction_id")

# Transaction Item  (line items in a sale) 12
class TransactionItem(Base):
    __tablename__ = "transaction_items"
    __table_args__ = (
        UniqueConstraint("transaction_id", "product_id", name="uq_txn_product"),
    )

    item_id            = Column(Integer,       primary_key=True, autoincrement=True)
    transaction_id     = Column(Integer,       ForeignKey("transactions.transaction_id", ondelete="CASCADE"),  nullable=False)
    product_id         = Column(Integer,       ForeignKey("products.product_id",         ondelete="RESTRICT"), nullable=False)
    quantity           = Column(Integer,       nullable=False)
    unit_price_at_sale = Column(Numeric(10,2), nullable=False)
    discount_id        = Column(Integer,       ForeignKey("discounts.discount_id",       ondelete="SET NULL"), nullable=True)
    discount           = Column(Numeric(10,2), nullable=False, default=0.00)
    line_total         = Column(Numeric(12,2), nullable=False)

    transaction  = relationship("Transaction", back_populates="items")
    product      = relationship("Product",     back_populates="transaction_items")
    discount_ref = relationship("Discount",    back_populates="transaction_items", foreign_keys=[discount_id])


# Transaction Discount  (session-level discounts) 13
class TransactionDiscount(Base):
    __tablename__ = "transaction_discounts"
    __table_args__ = (
        UniqueConstraint("transaction_id", "discount_id", name="uq_txn_discount"),
    )

    id             = Column(Integer,       primary_key=True, autoincrement=True)
    transaction_id = Column(Integer,       ForeignKey("transactions.transaction_id", ondelete="CASCADE"),  nullable=False)
    discount_id    = Column(Integer,       ForeignKey("discounts.discount_id",       ondelete="RESTRICT"), nullable=False)
    applied_amount = Column(Numeric(10,2), nullable=False)
    applied_at     = Column(DateTime,      nullable=False, server_default=func.now())

    transaction = relationship("Transaction", back_populates="transaction_discounts")
    discount    = relationship("Discount",    back_populates="transaction_discounts")

# Payment 14
class Payment(Base):
    __tablename__ = "payments"

    payment_id        = Column(Integer,       primary_key=True, autoincrement=True)
    transaction_id    = Column(Integer,       ForeignKey("transactions.transaction_id", ondelete="CASCADE"), nullable=False)
    payment_method    = Column(Enum(PaymentMethod), nullable=False)
    amount            = Column(Numeric(12,2), nullable=False)
    payment_status    = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.pending)
    payment_reference = Column(String(100),   nullable=True)
    paid_at           = Column(DateTime,      nullable=True)

    transaction = relationship("Transaction", back_populates="payments")

# Refund 15
class RefundItem(Base):
    __tablename__ = "refund_items"

    refund_id               = Column(Integer,       primary_key=True, autoincrement=True)
    original_transaction_id = Column(Integer,       ForeignKey("transactions.transaction_id", ondelete="RESTRICT"), nullable=False)
    refund_transaction_id   = Column(Integer,       ForeignKey("transactions.transaction_id", ondelete="RESTRICT"), nullable=False)
    product_id              = Column(Integer,       ForeignKey("products.product_id",         ondelete="RESTRICT"), nullable=False)
    quantity_returned       = Column(Integer,       nullable=False)
    refund_amount           = Column(Numeric(10,2), nullable=False)
    reason                  = Column(Enum(RefundReason), nullable=False)
    notes                   = Column(Text,          nullable=True)
    processed_by            = Column(Integer,       ForeignKey("users.user_id", ondelete="RESTRICT"), nullable=False)
    created_at              = Column(DateTime,      nullable=False, server_default=func.now())

    original_transaction = relationship("Transaction", back_populates="original_refunds",    foreign_keys=[original_transaction_id])
    refund_transaction   = relationship("Transaction", back_populates="refund_transactions", foreign_keys=[refund_transaction_id])
    product              = relationship("Product",     back_populates="refund_items")
    processed_by_user    = relationship("User",        back_populates="refunds_processed",   foreign_keys=[processed_by])

# Category 16
class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint("store_id", "category_name", name="uq_store_category"),
    )

    category_id        = Column(Integer,     primary_key=True, autoincrement=True)
    store_id           = Column(Integer,     ForeignKey("stores.store_id",        ondelete="CASCADE"),  nullable=True)
    category_name      = Column(String(100), nullable=False)
    parent_category_id = Column(Integer,     ForeignKey("categories.category_id", ondelete="SET NULL"), nullable=True)
    description        = Column(Text,        nullable=True)

    store    = relationship("Store", back_populates="categories",  foreign_keys=[store_id])
    parent   = relationship("Category", remote_side="Category.category_id", back_populates="children")
    children = relationship("Category", back_populates="parent")
    products = relationship("Product",  back_populates="category")
    discounts= relationship("Discount", back_populates="category")

# Product 17
class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("store_id", "barcode", name="uq_store_barcode"),
    )

    product_id      = Column(Integer,       primary_key=True, autoincrement=True)
    store_id        = Column(Integer,       ForeignKey("stores.store_id",        ondelete="RESTRICT"), nullable=False)
    category_id     = Column(Integer,       ForeignKey("categories.category_id", ondelete="SET NULL"), nullable=True)
    product_name    = Column(String(200),   nullable=False)
    barcode         = Column(String(100),   nullable=False)
    description     = Column(Text,          nullable=True)
    unit_price      = Column(Numeric(10,2), nullable=False)
    tax_rate        = Column(Numeric(5,2),  nullable=False, default=0.00)
    unit_of_measure = Column(String(30),    nullable=True)
    is_active       = Column(Boolean,       nullable=False, default=True)
    created_at      = Column(DateTime,      nullable=False, server_default=func.now())
    updated_at      = Column(DateTime,      nullable=True,  onupdate=func.now())

    store                = relationship("Store",               back_populates="products")
    category             = relationship("Category",            back_populates="products")
    inventory            = relationship("Inventory",           back_populates="product",  uselist=False)
    product_suppliers    = relationship("ProductSupplier",     back_populates="product")
    price_history        = relationship("ProductPriceHistory", back_populates="product")
    images               = relationship("ProductImage",        back_populates="product")
    inventory_logs       = relationship("InventoryLog",        back_populates="product")
    discounts            = relationship("Discount",            back_populates="product")
    transaction_items    = relationship("TransactionItem",     back_populates="product")
    purchase_order_items = relationship("PurchaseOrderItem",   back_populates="product")
    refund_items         = relationship("RefundItem",          back_populates="product")
    sales_forecasts      = relationship("SalesForecast",       back_populates="product")

# Product Image 18
class ProductImage(Base):
    __tablename__ = "product_images"

    image_id      = Column(Integer,     primary_key=True, autoincrement=True)
    product_id    = Column(Integer,     ForeignKey("products.product_id", ondelete="CASCADE"),  nullable=False)
    image_url     = Column(String(500), nullable=False)
    alt_text      = Column(String(255), nullable=True)
    is_primary    = Column(Boolean,     nullable=False, default=False)
    display_order = Column(Integer,     nullable=False, default=0)
    uploaded_by   = Column(Integer,     ForeignKey("users.user_id",       ondelete="SET NULL"), nullable=True)
    created_at    = Column(DateTime,    nullable=False, server_default=func.now())

    product  = relationship("Product", back_populates="images")
    uploader = relationship("User",    back_populates="uploaded_images", foreign_keys=[uploaded_by])


# Price History 19
class ProductPriceHistory(Base):
    __tablename__ = "product_price_history"

    price_history_id = Column(Integer,       primary_key=True, autoincrement=True)
    product_id       = Column(Integer,       ForeignKey("products.product_id", ondelete="CASCADE"),  nullable=False)
    old_price        = Column(Numeric(10,2), nullable=False)
    new_price        = Column(Numeric(10,2), nullable=False)
    changed_by       = Column(Integer,       ForeignKey("users.user_id",       ondelete="RESTRICT"), nullable=False)
    reason           = Column(String(255),   nullable=True)
    changed_at       = Column(DateTime,      nullable=False, server_default=func.now())

    product         = relationship("Product", back_populates="price_history")
    changed_by_user = relationship("User",    back_populates="price_changes", foreign_keys=[changed_by])

# Inventory 20

class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = (
        UniqueConstraint("product_id", "store_id", name="uq_product_inventory"),
    )

    inventory_id      = Column(Integer,  primary_key=True, autoincrement=True)
    product_id        = Column(Integer,  ForeignKey("products.product_id", ondelete="RESTRICT"), nullable=False)
    store_id          = Column(Integer,  ForeignKey("stores.store_id",     ondelete="RESTRICT"), nullable=False)
    quantity_in_stock = Column(Integer,  nullable=False, default=0)
    reorder_level     = Column(Integer,  nullable=True)
    last_restocked_at = Column(DateTime, nullable=True)
    updated_at        = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    product        = relationship("Product",      back_populates="inventory")
    store          = relationship("Store",        back_populates="inventory_items")
    inventory_logs = relationship("InventoryLog", back_populates="inventory")


# Inventory Log  (movement history) 21
class InventoryLog(Base):
    __tablename__ = "inventory_logs"

    log_id          = Column(BigInteger, primary_key=True, autoincrement=True)
    inventory_id    = Column(Integer,    ForeignKey("inventory.inventory_id", ondelete="RESTRICT"), nullable=False)
    product_id      = Column(Integer,    ForeignKey("products.product_id",    ondelete="RESTRICT"), nullable=False)
    store_id        = Column(Integer,    ForeignKey("stores.store_id",         ondelete="RESTRICT"), nullable=False)
    movement_type   = Column(Enum(MovementType), nullable=False)
    quantity_change = Column(Integer,    nullable=False)
    quantity_before = Column(Integer,    nullable=False)
    quantity_after  = Column(Integer,    nullable=False)
    reference_type  = Column(Enum(InventoryReferenceType),   nullable=True)
    reference_id    = Column(Integer,    nullable=True)
    notes           = Column(Text,       nullable=True)
    performed_by    = Column(Integer,    ForeignKey("users.user_id", ondelete="RESTRICT"), nullable=False)
    created_at      = Column(DateTime,   nullable=False, server_default=func.now())

    inventory         = relationship("Inventory", back_populates="inventory_logs")
    product           = relationship("Product",   back_populates="inventory_logs")
    store             = relationship("Store",     back_populates="inventory_logs")
    performed_by_user = relationship("User",      back_populates="inventory_logs", foreign_keys=[performed_by])

# Supplier 22
class Supplier(Base):
    __tablename__ = "suppliers"

    supplier_id    = Column(Integer,     primary_key=True, autoincrement=True)
    store_id       = Column(Integer,     ForeignKey("stores.store_id", ondelete="RESTRICT"), nullable=False)
    supplier_name  = Column(String(150), nullable=False)
    contact_person = Column(String(100), nullable=True)
    email          = Column(String(150), nullable=True)
    phone          = Column(String(20),  nullable=True)
    address        = Column(Text,        nullable=True)
    is_active      = Column(Boolean,     nullable=False, default=True)
    created_at     = Column(DateTime,    nullable=False, server_default=func.now())

    store            = relationship("Store", back_populates="suppliers")
    product_suppliers = relationship("ProductSupplier", back_populates="supplier")
    purchase_orders   = relationship("PurchaseOrder",   back_populates="supplier")


# Product ↔ Supplier  (junction with pricing) 23
class ProductSupplier(Base):
    __tablename__ = "product_suppliers"
    __table_args__ = (
        UniqueConstraint("product_id", "supplier_id", name="uq_product_supplier"),
    )

    product_supplier_id = Column(Integer,       primary_key=True, autoincrement=True)
    product_id          = Column(Integer,       ForeignKey("products.product_id",   ondelete="CASCADE"), nullable=False)
    supplier_id         = Column(Integer,       ForeignKey("suppliers.supplier_id", ondelete="CASCADE"), nullable=False)
    supply_price        = Column(Numeric(10,2), nullable=True)
    lead_time_days      = Column(Integer,       nullable=True)
    is_preferred        = Column(Boolean,       nullable=False, default=False)

    product  = relationship("Product",  back_populates="product_suppliers")
    supplier = relationship("Supplier", back_populates="product_suppliers")


# Purchase Order 24
class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    order_id      = Column(Integer,  primary_key=True, autoincrement=True)
    store_id      = Column(Integer,  ForeignKey("stores.store_id",       ondelete="RESTRICT"), nullable=False)
    supplier_id   = Column(Integer,  ForeignKey("suppliers.supplier_id", ondelete="RESTRICT"), nullable=False)
    ordered_by    = Column(Integer,  ForeignKey("users.user_id",          ondelete="RESTRICT"), nullable=False)
    status        = Column(Enum(PurchaseOrderStatus), nullable=False, default=PurchaseOrderStatus.pending)
    order_date    = Column(DateTime, nullable=False, server_default=func.now())
    expected_date = Column(Date,     nullable=True)
    received_date = Column(DateTime, nullable=True)
    notes         = Column(Text,     nullable=True)
    created_at    = Column(DateTime, nullable=False, server_default=func.now())

    store           = relationship("Store",             back_populates="purchase_orders")
    supplier        = relationship("Supplier",          back_populates="purchase_orders")
    ordered_by_user = relationship("User",              back_populates="purchase_orders", foreign_keys=[ordered_by])
    items           = relationship("PurchaseOrderItem", back_populates="order",           cascade="all, delete-orphan")


# Purchase Order Item 25
class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    item_id           = Column(Integer,       primary_key=True, autoincrement=True)
    order_id          = Column(Integer,       ForeignKey("purchase_orders.order_id", ondelete="CASCADE"),  nullable=False)
    product_id        = Column(Integer,       ForeignKey("products.product_id",      ondelete="RESTRICT"), nullable=False)
    quantity_ordered  = Column(Integer,       nullable=False)
    unit_cost         = Column(Numeric(10,2), nullable=False)
    quantity_received = Column(Integer,       nullable=True)

    order   = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product",       back_populates="purchase_order_items")

# IoT Device  (ESP32 + barcode scanner) 26
class IoTDevice(Base):
    __tablename__ = "iot_devices"

    device_id         = Column(Integer,     primary_key=True, autoincrement=True)
    store_id          = Column(Integer,     ForeignKey("stores.store_id", ondelete="RESTRICT"), nullable=False)
    device_identifier = Column(String(100), nullable=False, unique=True)
    device_type       = Column(String(50),  nullable=False)
    mqtt_username     = Column(String(100), nullable=True, unique=True)
    is_active         = Column(Boolean,     nullable=False, default=True)
    registered_at     = Column(DateTime,    nullable=False, server_default=func.now())
    last_seen_at      = Column(DateTime,    nullable=True)

    store     = relationship("Store",   back_populates="iot_devices")
    scan_logs = relationship("ScanLog", back_populates="device")

# IoT Scan  (raw barcode scan events) 27
class ScanLog(Base):
    __tablename__ = "scan_logs"

    scan_id        = Column(BigInteger,  primary_key=True, autoincrement=True)
    device_id      = Column(Integer,     ForeignKey("iot_devices.device_id",       ondelete="RESTRICT"), nullable=False)
    barcode_value  = Column(String(150), nullable=False)
    scan_timestamp = Column(DateTime,    nullable=False)
    transaction_id = Column(Integer,     ForeignKey("transactions.transaction_id",  ondelete="SET NULL"), nullable=True)
    status         = Column(Enum(ScanStatus), nullable=False, default=ScanStatus.received)

    device              = relationship("IoTDevice",   back_populates="scan_logs")
    matched_transaction = relationship("Transaction", back_populates="scan_logs")

# Notification 28
class Notification(Base):
    __tablename__ = "notifications"

    notification_id   = Column(Integer,     primary_key=True, autoincrement=True)
    user_id           = Column(Integer,     ForeignKey("users.user_id",   ondelete="SET NULL"), nullable=True)
    store_id          = Column(Integer,     ForeignKey("stores.store_id", ondelete="SET NULL"), nullable=True)
    notification_type = Column(Enum(NotificationType),    nullable=False)
    channel           = Column(Enum(NotificationChannel), nullable=False)
    subject           = Column(String(255), nullable=True)
    body              = Column(Text,        nullable=False)
    status            = Column(Enum(NotificationStatus),  nullable=False, default=NotificationStatus.pending)
    reference_type    = Column(String(50),  nullable=True)
    reference_id      = Column(Integer,     nullable=True)
    sent_at           = Column(DateTime,    nullable=True)
    read_at           = Column(DateTime,    nullable=True)
    created_at        = Column(DateTime,    nullable=False, server_default=func.now())

    user  = relationship("User",  back_populates="notifications")
    store = relationship("Store", back_populates="notifications")

# Audit Log  (immutable system event log) 29
class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id      = Column(BigInteger,  primary_key=True, autoincrement=True)
    user_id     = Column(Integer,     ForeignKey("users.user_id",   ondelete="SET NULL"), nullable=True)
    store_id    = Column(Integer,     ForeignKey("stores.store_id", ondelete="SET NULL"), nullable=True)
    action      = Column(String(100), nullable=False)
    entity_type = Column(String(50),  nullable=True)
    entity_id   = Column(BigInteger,  nullable=True)
    old_value   = Column(JSON,        nullable=True)
    new_value   = Column(JSON,        nullable=True)
    ip_address  = Column(String(45),  nullable=True)
    created_at  = Column(DateTime,    nullable=False, server_default=func.now())

    user  = relationship("User",  back_populates="audit_logs")
    store = relationship("Store", back_populates="audit_logs")

# RAG Chunk  (vector knowledge base) 30
class RAGDocumentChunk(Base):
    __tablename__ = "rag_document_chunks"

    chunk_id        = Column(Integer,    primary_key=True, autoincrement=True)
    store_id        = Column(Integer,    ForeignKey("stores.store_id", ondelete="CASCADE"), nullable=False)
    source_type     = Column(Enum(RAGSourceType), nullable=False)
    access_level    = Column(Enum(RAGAccessLevel),   nullable=False)
    source_id       = Column(Integer,    nullable=True)
    chunk_text      = Column(Text,       nullable=False)
    faiss_index_id  = Column(BigInteger, nullable=True)
    embedding_model = Column(String(100),nullable=True)
    is_active       = Column(Boolean,    nullable=False, default=True)
    created_at      = Column(DateTime,   nullable=False, server_default=func.now())
    updated_at      = Column(DateTime,   nullable=True,  onupdate=func.now())

    store = relationship("Store", back_populates="rag_chunks")

# Chat Session 31
class ChatbotSession(Base):
    __tablename__ = "chatbot_sessions"

    session_id   = Column(Integer,  primary_key=True, autoincrement=True)
    user_id      = Column(Integer,  ForeignKey("users.user_id",   ondelete="SET NULL"),  nullable=True)
    store_id     = Column(Integer,  ForeignKey("stores.store_id", ondelete="RESTRICT"),  nullable=False)
    access_level = Column(Enum(RAGAccessLevel), nullable=False)
    started_at   = Column(DateTime, nullable=False, server_default=func.now())
    ended_at     = Column(DateTime, nullable=True)

    user     = relationship("User",           back_populates="chatbot_sessions")
    store    = relationship("Store",          back_populates="chatbot_sessions")
    messages = relationship("ChatbotMessage", back_populates="session", cascade="all, delete-orphan")

# Chat Message 32
class ChatbotMessage(Base):
    __tablename__ = "chatbot_messages"

    message_id        = Column(Integer,  primary_key=True, autoincrement=True)
    session_id        = Column(Integer,  ForeignKey("chatbot_sessions.session_id", ondelete="CASCADE"), nullable=False)
    sender_type       = Column(Enum(ChatSenderType), nullable=False)
    message_text      = Column(Text,     nullable=False)
    retrieved_context = Column(Text,     nullable=True)
    sent_at           = Column(DateTime, nullable=False, server_default=func.now())

    session = relationship("ChatbotSession", back_populates="messages")

# Sales Forecast  (scikit-learn predictions) 33
class SalesForecast(Base):
    __tablename__ = "sales_forecasts"

    forecast_id        = Column(Integer,       primary_key=True, autoincrement=True)
    store_id           = Column(Integer,       ForeignKey("stores.store_id",    ondelete="CASCADE"), nullable=False)
    product_id         = Column(Integer,       ForeignKey("products.product_id",ondelete="CASCADE"), nullable=False)
    forecast_date      = Column(Date,          nullable=False)
    predicted_quantity = Column(Numeric(10,2), nullable=False)
    rmse_score         = Column(Numeric(10,4), nullable=True)
    mae_score          = Column(Numeric(10,4), nullable=True)
    model_version      = Column(String(50),    nullable=True)
    generated_at       = Column(DateTime,      nullable=False, server_default=func.now())

    store   = relationship("Store",   back_populates="sales_forecasts")
    product = relationship("Product", back_populates="sales_forecasts")

# user_device_tokens 34
class UserDeviceToken(Base):
    __tablename__ = "user_device_tokens"
    __table_args__ = (
        UniqueConstraint("user_id", "device_token", name="uq_user_device_token"),
    )

    token_id     = Column(Integer,     primary_key=True, autoincrement=True)
    user_id      = Column(Integer,     ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    device_token = Column(String(500), nullable=False)
    platform     = Column(Enum(PushPlatform), nullable=False)
    is_active    = Column(Boolean,     nullable=False, default=True)
    last_used_at = Column(DateTime,    nullable=True)
    created_at   = Column(DateTime,    nullable=False, server_default=func.now())

    user = relationship("User", back_populates="device_tokens")
