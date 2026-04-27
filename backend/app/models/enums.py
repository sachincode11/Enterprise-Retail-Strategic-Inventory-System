"""
All enums for the Enterprise Retail & Strategic Inventory System (ERSIS).
"""
import enum


# Auth / User
class UserRole(str, enum.Enum):
    admin = "Admin"          # Shopkeeper / Admin — full access
    cashier = "Cashier"      # Billing & product lookup only
    customer = "Customer"    # Mobile app — own data only


class OTPPurpose(str, enum.Enum):
    login_2fa = "login_2fa"
    password_reset = "password_reset"
    email_verification = "email_verification"


class PushPlatform(str, enum.Enum):
    ios = "ios"
    android = "android"


# Store / Products
class PolicyAccessLevel(str, enum.Enum):
    public = "public"        # Visible to all (customers + shopkeeper)
    private = "private"      # Shopkeeper only


# Discounts
class DiscountType(str, enum.Enum):
    percentage = "percentage"      # e.g. 10 %
    fixed_amount = "fixed_amount"  # e.g. NPR 50 off


class DiscountAppliesTo(str, enum.Enum):
    product = "product"
    category = "category"
    transaction = "transaction"


# Transactions
class TransactionStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    cancelled = "cancelled"
    refunded = "refunded"


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    card = "card"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


# Inventory
class MovementType(str, enum.Enum):
    sale = "sale"                        # Stock reduced by a sale
    restock = "restock"                  # Stock added from supplier
    adjustment = "adjustment"            # Manual correction
    damage = "damage"                    # Stock lost due to damage
    return_ = "return"                   # Stock returned


class InventoryReferenceType(str, enum.Enum):
    transaction = "transaction"
    manual = "manual"
    return_ = "return"


# Purchase Orders (Supplier)
class PurchaseOrderStatus(str, enum.Enum):
    pending = "pending"
    partial = "partial"        # Some items received
    received = "received"      # All items received
    cancelled = "cancelled"


# IoT / Barcode Scanning
class DeviceType(str, enum.Enum):
    esp32_barcode_scanner = "esp32_barcode_scanner"


class ScanStatus(str, enum.Enum):
    received = "received"      # Scan received by backend
    processed = "processed"    # Matched to a product & added to session
    failed = "failed"          # Barcode not found / error


# Notifications
class NotificationType(str, enum.Enum):
    low_stock_alert     = "low_stock_alert"      
    transaction_receipt = "transaction_receipt"  
    otp                 = "otp"
    refund_processed    = "refund_processed"     
    system_alert        = "system_alert"


class NotificationChannel(str, enum.Enum):
    email = "email"
    in_app = "in_app"
    sms = "sms"


class NotificationStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"
    read = "read"


# Audit Logs
class AuditAction(str, enum.Enum):
    login = "login"
    logout = "logout"
    create = "create"
    update = "update"
    delete = "delete"
    transaction_complete = "transaction_complete"
    refund = "refund"
    discount_applied = "discount_applied"
    config_change = "config_change"


class AuditEntityType(str, enum.Enum):
    user = "user"
    product = "product"
    transaction = "transaction"
    inventory = "inventory"
    discount = "discount"
    supplier = "supplier"
    store = "store"
    purchase_order = "purchase_order"


# RAG / AI Chat
class RAGSourceType(str, enum.Enum):
    product = "product"
    store_policy = "store_policy"
    faq = "faq"
    inventory_summary = "inventory_summary"
    sales_analytics = "sales_analytics"


class RAGAccessLevel(str, enum.Enum):
    """Shared by chatbot_sessions, rag_document_chunks, store_policies."""
    public = "public"          # All users (customers & shopkeeper)
    shopkeeper = "shopkeeper"  # Shopkeeper / admin only
    customer = "customer"      # Authenticated customer only


class ChatSenderType(str, enum.Enum):
    user = "user"
    bot = "bot"


class ChatAccessLevel(str, enum.Enum):
    customer = "customer"
    shopkeeper = "shopkeeper"

class RefundReason(str, enum.Enum):
    defective            = "defective"
    wrong_item           = "wrong_item"
    customer_change_mind = "customer_change_mind"
    other                = "other"