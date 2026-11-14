from pydantic import BaseModel, EmailStr,Field
from datetime import datetime
from typing import Optional, Literal



# USER SCHEMAS

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: Literal[
        "customer",
        "restaurant_owner",
        "delivery_partner"
    ]



class UserResponse(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# RESTAURANT SCHEMAS

class RestaurantCreate(BaseModel):
    restaurant_name: str
    address: Optional[str] = None
    cuisine: Optional[str] = None
    rating: Optional[float] = None


class RestaurantResponse(BaseModel):
    restaurant_id: int
    owner_id: int
    restaurant_name: str
    address: Optional[str] = None
    cuisine: Optional[str] = None
    rating: Optional[float] = None
    is_active: bool

    class Config:
        from_attributes = True
        # MENU ITEM SCHEMAS

class MenuItemCreate(BaseModel):
    restaurant_id: int
    item_name: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    is_available: bool = True


class MenuItemResponse(BaseModel):
    item_id: int
    restaurant_id: int
    item_name: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    is_available: bool


class MenuItemUpdate(BaseModel):
    item_name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    is_available: Optional[bool] = None


    model_config = {
        "from_attributes": True
    }
    # ORDER SCHEMAS
class OrderItemCreate(BaseModel):
    item_id: int
    quantity: int


class OrderCreate(BaseModel):
    restaurant_id: int
    delivery_address: str
    delivery_phone: str
    items: list[OrderItemCreate]

class OrderResponse(BaseModel):
    order_id: int
    customer_id: int
    restaurant_id: int
    delivery_partner_id: Optional[int] = None
    delivery_address: Optional[str] = None
    delivery_phone: Optional[str] = None
    order_date: Optional[datetime] = None
    total_amount: float
    order_status: str

    model_config = {
        "from_attributes": True
    }


# ORDER ITEM RESPONSE

class OrderItemResponse(BaseModel):
    order_item_id: int
    order_id: int
    item_id: int
    quantity: int
    item_price: float

    model_config = {
        "from_attributes": True
    }
 # REVIEW SCHEMAS


class ReviewCreate(BaseModel):
    order_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    review_id: int
    restaurant_id: int
    order_id: int
    rating: int
    comment: Optional[str] = None
    review_date: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

    
class OrderStatusUpdate(BaseModel):
    order_status: Literal[
        "ACCEPTED",
        "PREPARING",
        "READY"
    ]
    
class DeliveryAssignment(BaseModel):
    delivery_partner_id: int

class DeliveryStatusUpdate(BaseModel):
    order_status: Literal[
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
        "DELIVERED"
    ]
class PaymentCreate(BaseModel):
    order_id: int


class PaymentResponse(BaseModel):
    payment_id: int
    order_id: int
    amount: float
    payment_status: Optional[str] = None
    transaction_type: Optional[str] = None
    transaction_date: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }
class ReturnRequestCreate(BaseModel):
    order_id: int
    reason: str


class ReturnRequestResponse(BaseModel):
    request_id: int
    order_id: int
    customer_id: int
    reason: str
    request_status: Optional[str] = None
    request_date: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }
class ReturnStatusUpdate(BaseModel):
    request_status: Literal[
        "APPROVED",
        "REJECTED"
    ]
class ReminderResponse(BaseModel):
    reminder_id: int
    order_id: int
    reminder_message: Optional[str] = None
    created_at: Optional[datetime] = None
    is_sent: Optional[bool] = False

    model_config = {
        "from_attributes": True
    }