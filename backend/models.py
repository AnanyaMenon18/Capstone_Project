
from sqlalchemy import (
    func,
    Column,
    Integer,
    String,
    DateTime,
    SmallInteger,
    ForeignKey,
    Boolean,
    Numeric,
    Text,
    text
)

from database import Base


# ==========================================
# 1. USERS TABLE
# ==========================================

class User(Base):

    __tablename__ = "Users"
    __table_args__ = {"schema": "dbo"}

    user_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(150),
        nullable=False
    )

    password = Column(
        String(255),
        nullable=False
    )

    phone = Column(
        String(15),
        nullable=True
    )

    role = Column(
        String(30),
        nullable=False
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )


# ==========================================
# 2. RESTAURANTS TABLE
# ==========================================

class Restaurant(Base):

    __tablename__ = "Restaurants"
    __table_args__ = {"schema": "dbo"}

    restaurant_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    owner_id = Column(
        Integer,
        ForeignKey("dbo.Users.user_id"),
        nullable=False
    )

    restaurant_name = Column(
        String(150),
        nullable=False
    )

    address = Column(
        String,
        nullable=True
    )

    cuisine = Column(
        String(100),
        nullable=True
    )

    rating = Column(
        Numeric,
        nullable=True
    )

    is_active = Column(
        Boolean,
        nullable=True
    )


# ==========================================
# 3. MENU ITEMS TABLE
# ==========================================

class MenuItem(Base):

    __tablename__ = "Menu_Items"
    __table_args__ = {"schema": "dbo"}

    item_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    restaurant_id = Column(
        Integer,
        ForeignKey("dbo.Restaurants.restaurant_id"),
        nullable=False
    )

    item_name = Column(
        String(150),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    price = Column(
        Numeric(10, 2),
        nullable=False
    )

    category = Column(
        String(100),
        nullable=True
    )

    is_available = Column(
        Boolean,
        nullable=True,
        server_default=text("1")
    )


# ==========================================
# 4. ORDERS TABLE
# ==========================================

class Order(Base):

    __tablename__ = "Orders"
    __table_args__ = {"schema": "dbo"}

    order_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("dbo.Users.user_id"),
        nullable=False
    )

    restaurant_id = Column(
        Integer,
        ForeignKey("dbo.Restaurants.restaurant_id"),
        nullable=False
    )

    delivery_partner_id = Column(
        Integer,
        ForeignKey("dbo.Users.user_id"),
        nullable=True
    )

    order_date = Column(
        DateTime,
        nullable=False,
        server_default=text("GETDATE()")
    )

    total_amount = Column(
        Numeric(10, 2),
        nullable=False
    )

    order_status = Column(
        String(30),
        nullable=False,
        server_default=text("'PLACED'")
    )

    # Delivery Details
    delivery_address = Column(
        String(500),
        nullable=True
    )

    delivery_phone = Column(
        String(15),
        nullable=True
    )


# ==========================================
# 5. ORDER ITEMS TABLE
# ==========================================

class OrderItem(Base):

    __tablename__ = "Order_Items"
    __table_args__ = {"schema": "dbo"}

    order_item_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("dbo.Orders.order_id"),
        nullable=False
    )

    item_id = Column(
        Integer,
        ForeignKey("dbo.Menu_Items.item_id"),
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    item_price = Column(
        Numeric(10, 2),
        nullable=False
    )


# ==========================================
# 6. REVIEWS TABLE
# ==========================================

class Review(Base):

    __tablename__ = "Reviews"
    __table_args__ = {"schema": "dbo"}

    review_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("dbo.Users.user_id"),
        nullable=False
    )

    restaurant_id = Column(
        Integer,
        ForeignKey("dbo.Restaurants.restaurant_id"),
        nullable=False
    )

    order_id = Column(
        Integer,
        ForeignKey("dbo.Orders.order_id"),
        nullable=False
    )

    rating = Column(
        SmallInteger,
        nullable=False
    )

    comment = Column(
        Text,
        nullable=True
    )

    review_date = Column(
        DateTime,
        nullable=True
    )


# ==========================================
# 7. PAYMENT LEDGER TABLE
# ==========================================

class PaymentLedger(Base):

    __tablename__ = "Payment_Ledger"
    __table_args__ = {"schema": "dbo"}

    payment_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("dbo.Orders.order_id"),
        nullable=False
    )

    amount = Column(
        Numeric(10, 2),
        nullable=False
    )

    payment_status = Column(
        String(20),
        nullable=True,
        server_default=text("'pending'")
    )

    transaction_type = Column(
        String(20),
        nullable=True,
        server_default=text("'payment'")
    )

    transaction_date = Column(
        DateTime,
        nullable=True,
        server_default=text("GETDATE()")
    )


# ==========================================
# 8. RETURN REQUESTS TABLE
# ==========================================

class ReturnRequest(Base):

    __tablename__ = "Return_Requests"
    __table_args__ = {"schema": "dbo"}

    request_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("dbo.Orders.order_id"),
        nullable=False
    )

    customer_id = Column(
        Integer,
        ForeignKey("dbo.Users.user_id"),
        nullable=False
    )

    reason = Column(
        Text,
        nullable=False
    )

    request_status = Column(
        String(20),
        nullable=True,
        server_default=text("'pending'")
    )

    request_date = Column(
        DateTime,
        nullable=True,
        server_default=text("GETDATE()")
    )


# ==========================================
# 9. REMINDERS TABLE
# ==========================================

class Reminder(Base):

    __tablename__ = "Reminders"
    __table_args__ = {"schema": "dbo"}

    reminder_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("dbo.Orders.order_id"),
        nullable=False
    )

    reminder_message = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        nullable=True,
        server_default=text("GETDATE()")
    )

    is_sent = Column(
        Boolean,
        nullable=True,
        server_default=text("0")
    )
