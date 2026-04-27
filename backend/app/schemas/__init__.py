from .schemas import (
    # Auth
    RegisterRequest,
    LoginRequest,
    OTPVerifyRequest,
    TokenResponse,
    RefreshRequest,

    # User
    UserOut,
    UserUpdate,
    AssignRoleRequest,
    StaffOut,

    # Store
    StoreCreate,
    StoreOut,

    # Category
    CategoryCreate,
    CategoryOut,

    # Product
    ProductCreate,
    ProductUpdate,
    ProductOut,

    # Inventory
    InventoryOut,
    InventoryAdjust,

    # Discount
    DiscountCreate,
    DiscountUpdate,
    DiscountOut,

    # Transaction
    TransactionItemIn,
    TransactionCreate,
    TransactionItemOut,
    TransactionOut,

    # Refund
    RefundCreate,

    # Supplier & Purchase Orders
    SupplierCreate,
    SupplierOut,
    PurchaseOrderItemIn,
    PurchaseOrderCreate,
    PurchaseOrderOut,

    # Notification
    NotificationOut,

    # Chat / RAG
    ChatMessageIn,
    ChatMessageOut,

    # FAQ & Policy
    FAQCreate,
    FAQOut,
    PolicyCreate,
    PolicyOut,

    # IoT Scan
    ScanOut,

    # Generic
    MessageResponse,
    PaginatedResponse,
)

__all__ = [
    # Auth
    "RegisterRequest",
    "LoginRequest",
    "OTPVerifyRequest",
    "TokenResponse",
    "RefreshRequest",

    # User
    "UserOut",
    "UserUpdate",
    "AssignRoleRequest",
    "StaffOut",

    # Store
    "StoreCreate",
    "StoreOut",

    # Category
    "CategoryCreate",
    "CategoryOut",

    # Product
    "ProductCreate",
    "ProductUpdate",
    "ProductOut",

    # Inventory
    "InventoryOut",
    "InventoryAdjust",

    # Discount
    "DiscountCreate",
    "DiscountUpdate",
    "DiscountOut",

    # Transaction
    "TransactionItemIn",
    "TransactionCreate",
    "TransactionItemOut",
    "TransactionOut",

    # Refund
    "RefundCreate",

    # Supplier & Purchase Orders
    "SupplierCreate",
    "SupplierOut",
    "PurchaseOrderItemIn",
    "PurchaseOrderCreate",
    "PurchaseOrderOut",

    # Notification
    "NotificationOut",

    # Chat / RAG
    "ChatMessageIn",
    "ChatMessageOut",

    # FAQ & Policy
    "FAQCreate",
    "FAQOut",
    "PolicyCreate",
    "PolicyOut",

    # IoT Scan
    "ScanOut",

    # Generic
    "MessageResponse",
    "PaginatedResponse",
]