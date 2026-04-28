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


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str
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
    created_at: datetime

    model_config = {"from_attributes": True}


class StaffOut(BaseModel):
    user_id: int
    name: str
    email: str
    phone: Optional[str]
    role: str
    store_id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": False}


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class AssignRoleRequest(BaseModel):
    user_id: int
    role: UserRole
    store_id: int


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
    # tax_rate: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# Category
class CategoryCreate(BaseModel):
    category_name: str
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
    description: Optional[str] = None
    unit_price: Decimal
    tax_rate: Decimal = Decimal("0.00")
    unit_of_measure: Optional[str] = None


class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    product_name: Optional[str] = None
    description: Optional[str] = None
    unit_price: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    unit_of_measure: Optional[str] = None
    is_active: Optional[bool] = None


class ProductOut(BaseModel):
    product_id: int
    store_id: int
    category_id: Optional[int]
    supplier_id: Optional[int] = None
    product_name: str
    barcode: str
    description: Optional[str]
    unit_price: Decimal
    tax_rate: Decimal
    unit_of_measure: Optional[str]
    is_active: bool
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
    min_purchase_amount: Optional[Decimal]
    valid_from: Optional[date]
    valid_until: Optional[date]
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


class TransactionCreate(BaseModel):
    customer_id: Optional[int] = None        # None = guest checkout
    items: list[TransactionItemIn]
    payment_method: PaymentMethod
    discount_ids: list[int] = []             # session-level discounts


class TransactionItemOut(BaseModel):
    item_id: int
    product_id: int
    quantity: int
    unit_price_at_sale: Decimal
    discount: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}


class TransactionOut(BaseModel):
    transaction_id: int
    invoice_number: str
    store_id: int
    cashier_id: int
    customer_id: Optional[int]
    transaction_date: datetime
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    status: TransactionStatus
    items: list[TransactionItemOut] = []

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


class SupplierOut(BaseModel):
    supplier_id: int
    store_id: Optional[int] = None
    supplier_name: str
    contact_person: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    is_active: bool

    model_config = {"from_attributes": True}


class PurchaseOrderItemIn(BaseModel):
    product_id: int
    quantity_ordered: int
    unit_cost: Decimal


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


# Generic response wrappers
class MessageResponse(BaseModel):
    message: str


class PaginatedResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list
