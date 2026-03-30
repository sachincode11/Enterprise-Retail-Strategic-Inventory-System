import enum

class SenderType(str, enum.Enum):
    user = "user"
    bot = "bot"

class AccessLevel(str, enum.Enum):
    public = "public"
    customer = "customer"
    staff = "staff"

class DiscountType(str, enum.Enum):
    percentage = "percentage"
    fixed = "fixed"

class AppliesTo(str, enum.Enum):
    product = "product"
    category = "category"
    order = "order"

class MovementType(str, enum.Enum):
    purchase = "purchase"
    sale = "sale"
    adjustment = "adjustment"
    return_ = "return"
    restock = "restock"

class ReferenceType(str, enum.Enum):
    transaction = "transaction"
    purchase_order = "purchase_order"
    adjustment = "adjustment"

class NotificationType(str, enum.Enum):
    low_stock = "low_stock"
    sale = "sale"
    otp = "otp"
    system = "system"

class NotificationChannel(str, enum.Enum):
    email = "email"
    push = "push"
    in_app = "in_app"

class NotificationStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"
    read = "read"

class OtpPurpose(str, enum.Enum):
    login = "login"
    register = "register"
    password_reset = "password_reset"

class PaymentMethod(str, enum.Enum):
    cash = "cash"
    card = "card"
    wallet = "wallet"
    qr = "qr"

class PaymentStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"

class PurchaseOrderStatus(str, enum.Enum):
    draft = "draft"
    ordered = "ordered"
    received = "received"
    cancelled = "cancelled"

class TransactionStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    voided = "voided"
    refunded = "refunded"

class ScanStatus(str, enum.Enum):
    matched = "matched"
    unmatched = "unmatched"
    error = "error"

class DevicePlatform(str, enum.Enum):
    android = "android"
    ios = "ios"
    web = "web"

class RefundReason(str, enum.Enum):
    defective = "defective"
    wrong_item = "wrong_item"
    customer_request = "customer_request"
    other = "other"

class SourceType(str, enum.Enum):
    faq = "faq"
    policy = "policy"
    product = "product"