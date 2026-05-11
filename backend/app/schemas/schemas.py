"""
Pydantic schemas (request / response models) for the API.
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator

from app.models.enums import (
    DiscountAppliesTo, DiscountType,
    InventoryReferenceType, MovementType, NotificationChannel, NotificationType,
    NotificationStatus,
    OTPPurpose, PaymentMethod, PolicyAccessLevel,
    PurchaseOrderStatus, RAGAccessLevel,
    RefundReason,
    ScanStatus, TransactionStatus, UserRole,
)


# Auth
class RegisterRequest(BaseModel):
    username: str
    first_name: str
    last_name: Optional[str] = None
    email: EmailStr
    password: str
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 8 or not any(c.isdigit() for c in v):
            raise ValueError("Password must be ≥8 chars and contain at least one digit.")
        return v


class StaffCreate(BaseModel):
    username: str
    first_name: str
    last_name: Optional[str] = None
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: UserRole

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 8 or not any(c.isdigit() for c in v):
            raise ValueError("Password must be ≥8 chars and contain at least one digit.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if len(v) < 8 or not any(c.isdigit() for c in v):
            raise ValueError("Password must be ≥8 chars and contain at least one digit.")
        return v


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str
    purpose: OTPPurpose


class ResendOTPRequest(BaseModel):
    email: EmailStr
    purpose: OTPPurpose = OTPPurpose.login_2fa


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# User
class UserOut(BaseModel):
    user_id: int
    username: str
    first_name: str
    last_name: Optional[str]
    email: str
    phone: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class StaffOut(BaseModel):
    user_id: int
    name: str
    username: str
    email: str
    phone: Optional[str]
    role: str
    store_id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": False}


class UserUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if len(v) < 8 or not any(c.isdigit() for c in v):
                raise ValueError("Password must be ≥8 chars and contain at least one digit.")
        return v


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class AssignRoleRequest(BaseModel):
    user_id: int
    role: UserRole
    store_id: int


class GuestCustomerOut(BaseModel):
    guest_id: int
    name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# Store
class StoreCreate(BaseModel):
    store_name: str
    address: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    # tax_rate: Decimal = Decimal("0.00")


class StoreOut(BaseModel):
    store_id: int
    store_name: str
    address: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    is_active: bool
    config: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class StoreUpdate(BaseModel):
    store_name: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    config: Optional[dict] = None


class StoreMinimal(BaseModel):
    store_id: int
    store_name: str

    model_config = {"from_attributes": True}


# Category
class CategoryCreate(BaseModel):
    category_name: str
    parent_category_id: Optional[int] = None
    description: Optional[str] = None


class CategoryUpdate(BaseModel):
    category_name: Optional[str] = None
    parent_category_id: Optional[int] = None
    description: Optional[str] = None


class CategoryOut(BaseModel):
    category_id: int
    store_id: int
    category_name: str
    parent_category_id: Optional[int]
    description: Optional[str]

    model_config = {"from_attributes": True}


# Product
class ProductCreate(BaseModel):
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    product_name: str
    barcode: str
    sku: Optional[str] = None
    description: Optional[str] = None
    unit_price: Decimal
    tax_rate: Decimal = Decimal("0.00")
    unit_of_measure: Optional[str] = None
    reorder_level: Optional[int] = None
    supply_price: Optional[Decimal] = None
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    product_name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    unit_price: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    unit_of_measure: Optional[str] = None
    is_active: Optional[bool] = None
    barcode: Optional[str] = None
    reorder_level: Optional[int] = None
    supply_price: Optional[Decimal] = None
    image_url: Optional[str] = None


class ProductOut(BaseModel):
    product_id: int
    store_id: int
    category_id: Optional[int]
    supplier_id: Optional[int] = None
    product_name: str
    barcode: str
    sku: Optional[str]
    description: Optional[str]
    unit_price: Decimal
    tax_rate: Decimal
    unit_of_measure: Optional[str] = None
    is_active: bool
    reorder_level: Optional[int] = None
    supply_price: Optional[Decimal] = None
    image_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# Inventory
class InventoryOut(BaseModel):
    inventory_id: int
    product_id: int
    store_id: int
    quantity_in_stock: int
    reorder_level: Optional[int]
    last_restocked_at: Optional[datetime]
    updated_at: datetime

    model_config = {"from_attributes": True}


class InventoryAdjust(BaseModel):
    quantity_change: int          # positive = add, negative = remove
    movement_type: MovementType
    reference_type: Optional[InventoryReferenceType] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None


# Discount
class DiscountCreate(BaseModel):
    discount_name: str
    discount_type: DiscountType
    discount_value: Decimal
    applies_to: DiscountAppliesTo
    product_id: Optional[int] = None
    category_id: Optional[int] = None
    min_purchase_amount: Optional[Decimal] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None


class DiscountOut(BaseModel):
    discount_id: int
    store_id: int
    discount_name: str
    discount_type: DiscountType
    discount_value: Decimal
    applies_to: DiscountAppliesTo
    product_id: Optional[int] = None
    category_id: Optional[int] = None
    min_purchase_amount: Optional[Decimal] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    is_active: bool

    model_config = {"from_attributes": True}


class DiscountUpdate(BaseModel):
    discount_name: Optional[str] = None
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[Decimal] = None
    applies_to: Optional[DiscountAppliesTo] = None
    product_id: Optional[int] = None
    category_id: Optional[int] = None
    min_purchase_amount: Optional[Decimal] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    is_active: Optional[bool] = None


# Transaction
class TransactionItemIn(BaseModel):
    product_id: int
    quantity: int
    discount_id: Optional[int] = None
    line_discount: Optional[Decimal] = 0.0


class TransactionCreate(BaseModel):
    customer_id: Optional[int] = None        # None = guest checkout
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None
    items: list[TransactionItemIn]
    payment_method: PaymentMethod
    discount_ids: list[int] = []             # session-level discounts
    manual_discount_percent: Optional[float] = 0.0
    manual_discount_amount: Optional[Decimal] = 0.0


class TransactionItemOut(BaseModel):
    item_id: int
    product_id: int
    quantity: int
    unit_price_at_sale: Decimal
    discount: Decimal
    line_total: Decimal
    product_name: Optional[str] = None  # Backward compatibility
    product: Optional[ProductOut] = None

    model_config = {"from_attributes": True}


class PaymentOut(BaseModel):
    payment_id: int
    payment_method: PaymentMethod
    amount: Decimal
    payment_status: str
    paid_at: Optional[datetime]

    model_config = {"from_attributes": True}


class TransactionOut(BaseModel):
    transaction_id: int
    invoice_number: str
    store_id: int
    store: Optional[StoreMinimal] = None
    cashier_id: int
    customer_id: Optional[int]
    customer_name: Optional[str] = None  # Populated via relationship or joined query
    customer_phone: Optional[str] = None # Populated via relationship or joined query
    guest_customer: Optional[GuestCustomerOut] = None
    transaction_date: datetime
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    status: TransactionStatus
    items: list[TransactionItemOut] = []
    payments: list[PaymentOut] = []

    model_config = {"from_attributes": True}


# Refund
class RefundCreate(BaseModel):
    original_transaction_id: int
    product_id: int
    quantity_returned: int
    reason: RefundReason
    notes: Optional[str] = None


# Supplier & Purchase Orders
class SupplierCreate(BaseModel):
    supplier_name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None


class SupplierUpdate(BaseModel):
    supplier_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None



class SupplierOut(BaseModel):
    supplier_id: int
    store_id: Optional[int] = None
    supplier_name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class PurchaseOrderItemIn(BaseModel):
    product_id: int
    quantity_ordered: int
    unit_cost: Decimal


class PurchaseOrderItemOut(BaseModel):
    item_id: int
    product_id: int
    quantity_ordered: int
    unit_cost: Decimal
    quantity_received: Optional[int]

    model_config = {"from_attributes": True}


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    items: list[PurchaseOrderItemIn]
    expected_date: Optional[date] = None
    notes: Optional[str] = None


class PurchaseOrderReceiptItemIn(BaseModel):
    product_id: int
    quantity_received: int


class PurchaseOrderStatusUpdate(BaseModel):
    status: PurchaseOrderStatus
    items: list[PurchaseOrderReceiptItemIn] = []


class PurchaseOrderOut(BaseModel):
    order_id: int
    store_id: int
    supplier_id: int
    status: PurchaseOrderStatus
    order_date: datetime
    expected_date: Optional[date]
    items: list[PurchaseOrderItemOut]

    model_config = {"from_attributes": True}


# Notification
class NotificationOut(BaseModel):
    notification_id: int
    notification_type: NotificationType
    channel: NotificationChannel
    subject: Optional[str]
    body: str
    status: NotificationStatus
    sent_at: Optional[datetime]
    read_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


# Chat / RAG
class ChatMessageIn(BaseModel):
    message: str
    store_id: int
    access_level: RAGAccessLevel


class ChatMessageOut(BaseModel):
    message_id: int
    sender_type: str
    message_text: str
    sent_at: datetime

    model_config = {"from_attributes": True}


# Store FAQ & Policy
class FAQCreate(BaseModel):
    question: str
    answer: str


class FAQOut(BaseModel):
    faq_id: int
    store_id: int
    question: str
    answer: str
    is_active: bool

    model_config = {"from_attributes": True}


class PolicyCreate(BaseModel):
    policy_name: str
    content: str
    access_level: PolicyAccessLevel = PolicyAccessLevel.public


class PolicyOut(BaseModel):
    policy_id: int
    store_id: int
    policy_name: str
    content: str
    access_level: PolicyAccessLevel
    is_active: bool

    model_config = {"from_attributes": True}


# IoT Scan
class ScanOut(BaseModel):
    scan_id: int
    device_id: int
    barcode_value: str
    scan_timestamp: datetime
    status: ScanStatus

    model_config = {"from_attributes": True}


# Customer Analytics
class SpendingTrend(BaseModel):
    week: str
    amount: float

class CategorySpend(BaseModel):
    name: str
    amount: float
    color: str

class TopStore(BaseModel):
    name: str
    visits: int
    spent: float

class CustomerAnalyticsOut(BaseModel):
    totalSpent: float
    totalSaved: float
    spentChange: float
    savedChange: float
    trend: list[SpendingTrend]
    categories: list[CategorySpend]
    topStore: TopStore


class CustomerSummaryOut(BaseModel):
    total: float
    change: float
    txnCount: int
    avgSpend: float
    saved: float
    loyaltyPoints: int


# Generic response wrappers
class MessageResponse(BaseModel):
    message: str


class PaginatedResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list

    model_config = {"from_attributes": True}


class TransactionPaginatedResponse(PaginatedResponse):
    items: list[TransactionOut]
