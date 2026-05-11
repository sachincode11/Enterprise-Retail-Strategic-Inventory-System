from .schemas import (
    # Auth
    RegisterRequest,
    LoginRequest,
    ResendOTPRequest,
    OTPVerifyRequest,
    TokenResponse,
    RefreshRequest,
    StaffCreate,
    PasswordChangeRequest,
    ForgotPasswordRequest,

    # User
    UserOut,
    UserUpdate,
    UserProfileUpdate,
    AssignRoleRequest,
    StaffOut,

    # Store
    StoreCreate,
    StoreOut,
    StoreUpdate,

    # Category
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,

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
    SupplierUpdate,
    SupplierOut,
    PurchaseOrderItemIn,
    PurchaseOrderReceiptItemIn,
    PurchaseOrderCreate,
    PurchaseOrderStatusUpdate,
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
    TransactionPaginatedResponse,

    # Analytics
    SpendingTrend,
    CategorySpend,
    TopStore,
    CustomerAnalyticsOut,
    CustomerSummaryOut,
)

__all__ = [
    # Auth
    "RegisterRequest",
    "LoginRequest",
    "ResendOTPRequest",
    "OTPVerifyRequest",
    "TokenResponse",
    "RefreshRequest",
    "StaffCreate",
    "PasswordChangeRequest",
    "ForgotPasswordRequest",

    # User
    "UserOut",
    "UserUpdate",
    "UserProfileUpdate",
    "AssignRoleRequest",
    "StaffOut",

    # Store
    "StoreCreate",
    "StoreOut",
    "StoreUpdate",

    # Category
    "CategoryCreate",
    "CategoryOut",
    "CategoryUpdate",

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
    "SupplierUpdate",
    "SupplierOut",
    "PurchaseOrderItemIn",
    "PurchaseOrderReceiptItemIn",
    "PurchaseOrderCreate",
    "PurchaseOrderStatusUpdate",
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
    "TransactionPaginatedResponse",

    # Analytics
    "SpendingTrend",
    "CategorySpend",
    "TopStore",
    "CustomerAnalyticsOut",
    "CustomerSummaryOut",
]