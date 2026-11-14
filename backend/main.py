from openai import OpenAI
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime
from typing import Optional, List
from database import get_db

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

from models import (
    User,
    Restaurant,
    MenuItem,
    Order,
    OrderItem,
    Review,
    PaymentLedger,
    ReturnRequest,
    Reminder
)

from schemas import (
    UserCreate,
    UserResponse,
    RestaurantCreate,
    RestaurantResponse,
    MenuItemCreate,
    MenuItemResponse,
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
    DeliveryAssignment,
    DeliveryStatusUpdate,
    ReviewCreate,
    ReviewResponse,
    PaymentCreate,
    PaymentResponse,
    ReturnRequestCreate,
    ReturnRequestResponse,
    ReturnStatusUpdate,
    ReminderResponse,
    MenuItemCreate,
    MenuItemResponse,
    MenuItemUpdate
)

from security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token
)


# =====================================================
# INITIALIZE FASTAPI
# =====================================================

app = FastAPI(
    title="CampusBite API",
    description="Restaurant Ordering and Delivery Platform",
    version="1.0.0"
)


# =====================================================
# CORS CONFIGURATION
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174",
    "https://near-loved-companies-gone.trycloudflare.com"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =====================================================
# AUTHENTICATION
# =====================================================

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


@app.get("/")
def home():
    return {
        "message": "Welcome to CampusBite API",
        "status": "Running"
    }


@app.get("/health/db")
def database_health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))

        return {
            "database": "Connected",
            "status": "Healthy"
        }

    except Exception as e:
        return {
            "database": "Disconnected",
            "error": str(e)
        }


# =====================================================
# USER MANAGEMENT
# =====================================================

@app.post("/users/", response_model=UserResponse)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        phone=user.phone,
        role=user.role
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user

    except Exception:
        db.rollback()
        raise


# =====================================================
# USER LOGIN
# =====================================================

@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not user or not verify_password(
        form_data.password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": str(user.user_id),
            "role": user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# =====================================================
# CURRENT USER
# =====================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user = db.query(User).filter(
        User.user_id == int(user_id)
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# =====================================================
# ROLE-BASED AUTHORIZATION
# =====================================================

def require_role(*allowed_roles: str):

    def role_checker(
        current_user: User = Depends(get_current_user)
    ):

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this resource"
            )

        return current_user

    return role_checker


# =====================================================
# USER PROFILE
# =====================================================
@app.get("/users/me", response_model=UserResponse)
def read_current_user(
    current_user: User = Depends(get_current_user)
):
    return current_user



# UPDATE CURRENT USER PROFILE

@app.put("/users/me", response_model=UserResponse)
def update_current_user(
    profile: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Allow only owners and delivery partners
    if current_user.role not in [
        "restaurant_owner",
        "delivery_partner"
    ]:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to update this profile"
        )

    name = profile.get("name")
    email = profile.get("email")
    phone = profile.get("phone")

    if not name or not email or not phone:
        raise HTTPException(
            status_code=400,
            detail="Name, email and phone are required"
        )

    # Check if email is already registered
    existing_user = db.query(User).filter(
        User.email == email.strip(),
        User.user_id != current_user.user_id
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="This email is already registered"
        )

    current_user.name = name.strip()
    current_user.email = email.strip()
    current_user.phone = phone.strip()

    db.commit()
    db.refresh(current_user)

    return current_user

# =====================================================
# DASHBOARDS
# =====================================================

@app.get("/customer/dashboard")
def customer_dashboard(
    current_user: User = Depends(require_role("customer"))
):
    return {
        "message": "Welcome to Customer Dashboard",
        "user": current_user.name
    }


@app.get("/owner/dashboard")
def owner_dashboard(
    current_user: User = Depends(require_role("restaurant_owner"))
):
    return {
        "message": "Welcome to Restaurant Owner Dashboard",
        "user": current_user.name
    }


@app.get("/delivery/dashboard")
def delivery_dashboard(
    current_user: User = Depends(require_role("delivery_partner"))
):
    return {
        "message": "Welcome to Delivery Partner Dashboard",
        "user": current_user.name
    }


# =====================================================
# RESTAURANT MANAGEMENT
# =====================================================

@app.post("/restaurants/", response_model=RestaurantResponse)
def create_restaurant(
    restaurant: RestaurantCreate,
    current_user: User = Depends(
        require_role("restaurant_owner")
    ),
    db: Session = Depends(get_db)
):

    new_restaurant = Restaurant(
        owner_id=current_user.user_id,
        restaurant_name=restaurant.restaurant_name,
        address=restaurant.address,
        cuisine=restaurant.cuisine,
        rating=restaurant.rating,
        is_active=True
    )

    try:
        db.add(new_restaurant)
        db.commit()
        db.refresh(new_restaurant)

        return new_restaurant

    except Exception:
        db.rollback()
        raise


@app.get(
    "/restaurants/",
    response_model=list[RestaurantResponse]
)
def get_all_restaurants(
    db: Session = Depends(get_db)
):

    restaurants = db.query(Restaurant).filter(
        Restaurant.is_active == True
    ).all()

    return restaurants
# GET OWNER'S RESTAURANTS
@app.get("/owner/restaurants", response_model=List[RestaurantResponse])
def get_owner_restaurants(
    current_user: User = Depends(require_role("restaurant_owner")),
    db: Session = Depends(get_db)
):
    restaurants = db.query(Restaurant).filter(
        Restaurant.owner_id == current_user.user_id
    ).all()

    return restaurants

# =====================================================
# MENU ITEM MANAGEMENT
# =====================================================

@app.post("/menu-items/", response_model=MenuItemResponse)
def create_menu_item(
    item: MenuItemCreate,
    current_user: User = Depends(
        require_role("restaurant_owner")
    ),
    db: Session = Depends(get_db)
):

    restaurant = db.query(Restaurant).filter(
        Restaurant.restaurant_id == item.restaurant_id,
        Restaurant.owner_id == current_user.user_id
    ).first()

    if restaurant is None:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found or you do not own this restaurant"
        )

    new_item = MenuItem(
        restaurant_id=item.restaurant_id,
        item_name=item.item_name,
        description=item.description,
        price=item.price,
        category=item.category,
        is_available=item.is_available
    )

    try:
        db.add(new_item)
        db.commit()
        db.refresh(new_item)

        return new_item

    except Exception:
        db.rollback()
        raise
    
# UPDATE MENU ITEM
@app.patch("/menu-items/{item_id}", response_model=MenuItemResponse)
def update_menu_item(
    item_id: int,
    item_data: MenuItemUpdate,
    current_user: User = Depends(require_role("restaurant_owner")),
    db: Session = Depends(get_db)
):
    # Find the menu item
    menu_item = db.query(MenuItem).filter(
        MenuItem.item_id == item_id
    ).first()

    if menu_item is None:
        raise HTTPException(
            status_code=404,
            detail="Menu item not found"
        )

    # Verify restaurant ownership
    restaurant = db.query(Restaurant).filter(
        Restaurant.restaurant_id == menu_item.restaurant_id,
        Restaurant.owner_id == current_user.user_id
    ).first()

    if restaurant is None:
        raise HTTPException(
            status_code=403,
            detail="You cannot update this menu item"
        )

    # Update only the fields provided
    update_data = item_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(menu_item, field, value)

    try:
        db.commit()
        db.refresh(menu_item)
        return menu_item

    except Exception:
        db.rollback()
        raise


@app.get(
    "/menu-items/",
    response_model=list[MenuItemResponse]
)
def get_all_menu_items(
    db: Session = Depends(get_db)
):

    return db.query(MenuItem).all()


@app.get(
    "/restaurants/{restaurant_id}/menu",
    response_model=list[MenuItemResponse]
)
def get_restaurant_menu(
    restaurant_id: int,
    db: Session = Depends(get_db)
):

    return db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant_id
    ).all()


# =====================================================
# CUSTOMER - PLACE ORDER
# =====================================================

@app.post("/orders/", response_model=OrderResponse)
def create_order(
    order: OrderCreate,
    current_user: User = Depends(
        require_role("customer")
    ),
    db: Session = Depends(get_db)
):

    restaurant = db.query(Restaurant).filter(
        Restaurant.restaurant_id == order.restaurant_id
    ).first()

    if restaurant is None:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    if not order.items:
        raise HTTPException(
            status_code=400,
            detail="Order must contain at least one item"
        )

    total_amount = 0
    order_items = []

    for requested_item in order.items:

        if requested_item.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Quantity must be greater than zero"
            )

        menu_item = db.query(MenuItem).filter(
            MenuItem.item_id == requested_item.item_id,
            MenuItem.restaurant_id == order.restaurant_id,
            MenuItem.is_available == True
        ).first()

        if menu_item is None:
            raise HTTPException(
                status_code=404,
                detail=f"Menu item {requested_item.item_id} not found or unavailable"
            )

        item_total = (
            float(menu_item.price) *
            requested_item.quantity
        )

        total_amount += item_total

        order_items.append(
            OrderItem(
                item_id=menu_item.item_id,
                quantity=requested_item.quantity,
                item_price=menu_item.price
            )
        )

    try:

        new_order = Order(
            customer_id=current_user.user_id,
            restaurant_id=order.restaurant_id,
            total_amount=total_amount,
            order_status="PLACED",
            delivery_address=order.delivery_address,
            delivery_phone=order.delivery_phone
        )

        db.add(new_order)
        db.flush()

        for item in order_items:
            item.order_id = new_order.order_id
            db.add(item)

        new_reminder = Reminder(
            order_id=new_order.order_id,
            reminder_message=(
                f"Your order #{new_order.order_id} "
                "has been placed successfully. "
                "Track your order status in CampusBite."
            ),
            is_sent=False
        )

        db.add(new_reminder)

        db.commit()
        db.refresh(new_order)

        return new_order

    except Exception:
        db.rollback()
        raise


# =====================================================
# CUSTOMER - ORDER HISTORY
# =====================================================

@app.get(
    "/orders/my-orders",
    response_model=list[OrderResponse]
)
def get_my_orders(
    current_user: User = Depends(require_role("customer")),
    db: Session = Depends(get_db)

):

    return db.query(Order).filter(
        Order.customer_id == current_user.user_id
    ).order_by(
        Order.order_date.desc()
   
       
        ).all()



# =====================================================
# CUSTOMER - ORDER DETAILS
# =====================================================

@app.get("/orders/{order_id}/details")
def get_order_details(
    order_id: int,
    current_user: User = Depends(require_role("customer")),
    db: Session = Depends(get_db)
):

    order = db.query(Order).filter(
        Order.order_id == order_id,
        Order.customer_id == current_user.user_id
    ).first()

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    order_items = (
        db.query(OrderItem, MenuItem)
        .join(
            MenuItem,
            OrderItem.item_id == MenuItem.item_id
        )
        .filter(
            OrderItem.order_id == order_id
        )
        .all()
    )

    items = []

    for order_item, menu_item in order_items:

        items.append({
            "order_item_id": order_item.order_item_id,
            "item_id": order_item.item_id,
            "item_name": menu_item.item_name,
            "quantity": order_item.quantity,
            "item_price": float(order_item.item_price),
            "subtotal": float(
                order_item.item_price * order_item.quantity
            )
        })

    return {
        "order_id": order.order_id,
        "customer_id": order.customer_id,
        "restaurant_id": order.restaurant_id,
        "order_date": order.order_date,
        "order_status": order.order_status,
        "delivery_address": order.delivery_address,
        "delivery_phone": order.delivery_phone,
        "total_amount": float(order.total_amount),
        "items": items
    }


# =====================================================
# RESTAURANT OWNER - VIEW ORDERS
# =====================================================

@app.get(
    "/owner/orders",
    response_model=list[OrderResponse]
)
def get_owner_orders(
    current_user: User = Depends(
        require_role("restaurant_owner")
    ),
    db: Session = Depends(get_db)
):

    owner_restaurants = db.query(Restaurant).filter(
        Restaurant.owner_id == current_user.user_id
    ).all()

    restaurant_ids = [
        restaurant.restaurant_id
        for restaurant in owner_restaurants
    ]

    return db.query(Order).filter(
        Order.restaurant_id.in_(restaurant_ids)
    ).order_by(
        Order.order_date.desc()
    ).all()


# =====================================================
# RESTAURANT OWNER - UPDATE ORDER STATUS
# =====================================================

@app.patch("/owner/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    current_user: User = Depends(
        require_role("restaurant_owner")
    ),
    db: Session = Depends(get_db)
):

    order = db.query(Order).filter(
        Order.order_id == order_id
    ).first()

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    restaurant = db.query(Restaurant).filter(
        Restaurant.restaurant_id == order.restaurant_id,
        Restaurant.owner_id == current_user.user_id
    ).first()

    if restaurant is None:
        raise HTTPException(
            status_code=403,
            detail="You cannot update this order"
        )

    allowed_transitions = {
        "PLACED": ["ACCEPTED"],
        "ACCEPTED": ["PREPARING"],
        "PREPARING": ["READY"]
    }

    current_status = order.order_status
    new_status = status_data.order_status

    if new_status not in allowed_transitions.get(
        current_status, []
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid status transition: "
                f"{current_status} cannot be changed to "
                f"{new_status}. Please follow the correct workflow."
            )
        )

    order.order_status = new_status

    try:
        db.commit()
        db.refresh(order)

        return {
            "message": "Order status updated successfully",
            "order_id": order.order_id,
            "order_status": order.order_status
        }

    except Exception:
        db.rollback()
        raise


# =====================================================
# RESTAURANT OWNER - ASSIGN DELIVERY PARTNER
# =====================================================

@app.patch("/owner/orders/{order_id}/assign-delivery")
def assign_delivery_partner(
    order_id: int,
    assignment: DeliveryAssignment,
    current_user: User = Depends(
        require_role("restaurant_owner")
    ),
    db: Session = Depends(get_db)
):

    order = db.query(Order).filter(
        Order.order_id == order_id
    ).first()

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    restaurant = db.query(Restaurant).filter(
        Restaurant.restaurant_id == order.restaurant_id,
        Restaurant.owner_id == current_user.user_id
    ).first()

    if restaurant is None:
        raise HTTPException(
            status_code=403,
            detail="You cannot assign delivery for this order"
        )

    delivery_partner = db.query(User).filter(
        User.user_id == assignment.delivery_partner_id,
        User.role == "delivery_partner"
    ).first()

    if delivery_partner is None:
        raise HTTPException(
            status_code=404,
            detail="Delivery partner not found"
        )

    order.delivery_partner_id = delivery_partner.user_id

    try:
        db.commit()
        db.refresh(order)

        return {
            "message": "Delivery partner assigned successfully",
            "order_id": order.order_id,
            "delivery_partner_id": order.delivery_partner_id
        }

    except Exception:
        db.rollback()
        raise

# =====================================================
# RESTAURANT OWNER - GET DELIVERY PARTNERS
# =====================================================

@app.get("/owner/delivery-partners")
def get_delivery_partners(
    current_user: User = Depends(
        require_role("restaurant_owner")
    ),
    db: Session = Depends(get_db)
):
    partners = db.query(User).filter(
        User.role == "delivery_partner"
    ).all()

    return [
        {
            "user_id": partner.user_id,
            "name": partner.name,
            "email": partner.email,
            "phone": partner.phone
        }
        for partner in partners
    ]


# =====================================================
# DELIVERY PARTNER - VIEW ASSIGNED ORDERS
# =====================================================

@app.get(
    "/delivery/my-orders",
    response_model=list[OrderResponse]
)
def get_delivery_orders(
    current_user: User = Depends(
        require_role("delivery_partner")
    ),
    db: Session = Depends(get_db)
):

    return db.query(Order).filter(
        Order.delivery_partner_id == current_user.user_id
    ).order_by(
        Order.order_date.desc()
    ).all()


# =====================================================
# DELIVERY PARTNER - UPDATE DELIVERY STATUS
# =====================================================

@app.patch("/delivery/orders/{order_id}/status")
def update_delivery_status(
    order_id: int,
    status_data: DeliveryStatusUpdate,
    current_user: User = Depends(
        require_role("delivery_partner")
    ),
    db: Session = Depends(get_db)
):

    order = db.query(Order).filter(
        Order.order_id == order_id,
        Order.delivery_partner_id == current_user.user_id
    ).first()

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found or not assigned to you"
        )

    allowed_transitions = {
        "READY": ["PICKED_UP"],
        "PICKED_UP": ["OUT_FOR_DELIVERY"],
        "OUT_FOR_DELIVERY": ["DELIVERED"]
    }

    new_status = status_data.order_status

    if new_status not in allowed_transitions.get(
        order.order_status, []
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot change status from "
                f"{order.order_status} to {new_status}"
            )
        )

    order.order_status = new_status

    try:
        db.commit()
        db.refresh(order)

        return {
            "message": "Delivery status updated successfully",
            "order_id": order.order_id,
            "order_status": order.order_status
        }

    except Exception:
        db.rollback()
        raise


# =====================================================
# CUSTOMER - SUBMIT RESTAURANT REVIEW
# =====================================================


@app.post("/reviews/", response_model=ReviewResponse)
def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(
        require_role("customer")
    ),
    db: Session = Depends(get_db)
):

    order = db.query(Order).filter(
        Order.order_id == review_data.order_id,
        Order.customer_id == current_user.user_id
    ).first()

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    if order.order_status != "DELIVERED":
        raise HTTPException(
            status_code=400,
            detail="Only delivered orders can be reviewed"
        )

    existing_review = db.query(Review).filter(
        Review.order_id == review_data.order_id
    ).first()

    if existing_review:
        raise HTTPException(
            status_code=400,
            detail="This order has already been reviewed"
        )

    new_review = Review(
        customer_id=current_user.user_id,
        restaurant_id=order.restaurant_id,
        order_id=order.order_id,
        rating=review_data.rating,
        comment=review_data.comment,
        review_date=datetime.now()
    )

    try:
        db.add(new_review)
        db.commit()
        db.refresh(new_review)

        return new_review

    except Exception:
        db.rollback()
        raise
@app.get("/reviews/my-reviews", response_model=List[ReviewResponse])
def get_my_reviews(
    current_user: User = Depends(require_role("customer")),
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).filter(
        Review.customer_id == current_user.user_id
    ).order_by(Review.review_date.desc()).all()

    return reviews

# GET REVIEWS FOR A RESTAURANT
@app.get(
    "/restaurants/{restaurant_id}/reviews",
    response_model=List[ReviewResponse]
)
def get_restaurant_reviews(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    # Check whether restaurant exists
    restaurant = db.query(Restaurant).filter(
        Restaurant.restaurant_id == restaurant_id
    ).first()

    if restaurant is None:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    # Fetch all reviews for this restaurant
    reviews = db.query(Review).filter(
        Review.restaurant_id == restaurant_id
    ).order_by(
        Review.review_date.desc()
    ).all()

    return reviews
# GET RESTAURANT RATING SUMMARY
@app.get("/restaurants/{restaurant_id}/rating")
def get_restaurant_rating(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(
        Restaurant.restaurant_id == restaurant_id
    ).first()

    if restaurant is None:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found"
        )

    result = db.query(
        func.avg(Review.rating * 1.0),
        func.count(Review.review_id)
    ).filter(
        Review.restaurant_id == restaurant_id
    ).first()

    average_rating = float(result[0]) if result[0] is not None else 0
    total_reviews = result[1] or 0

    return {
        "restaurant_id": restaurant_id,
        "average_rating": round(average_rating, 1),
        "total_reviews": total_reviews
    }

# =====================================================
# CUSTOMER - CREATE SIMULATED PAYMENT
# =====================================================

@app.post("/payments/", response_model=PaymentResponse)
def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(
        require_role("customer")
    ),
    db: Session = Depends(get_db)
):

    order = db.query(Order).filter(
        Order.order_id == payment_data.order_id,
        Order.customer_id == current_user.user_id
    ).first()

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    # Prevent another payment transaction for this order
    existing_payment = db.query(PaymentLedger).filter(
        PaymentLedger.order_id == payment_data.order_id,
        PaymentLedger.transaction_type == "payment"
    ).first()

    if existing_payment:
        raise HTTPException(
            status_code=400,
            detail="A payment transaction already exists for this order"
        )

    new_payment = PaymentLedger(
        order_id=order.order_id,
        amount=order.total_amount,
        payment_status="SUCCESS",
        transaction_type="payment"
    )

    try:
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)

        return new_payment

    except Exception:
        db.rollback()
        raise


# =====================================================
# CUSTOMER - CREATE RETURN REQUEST
# =====================================================

@app.post(
    "/returns/",
    response_model=ReturnRequestResponse
)
def create_return_request(
    return_data: ReturnRequestCreate,
    current_user: User = Depends(
        require_role("customer")
    ),
    db: Session = Depends(get_db)
):

    order = db.query(Order).filter(
        Order.order_id == return_data.order_id,
        Order.customer_id == current_user.user_id
    ).first()

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    if order.order_status != "DELIVERED":
        raise HTTPException(
            status_code=400,
            detail="Only delivered orders can be returned"
        )

    existing_request = db.query(ReturnRequest).filter(
        ReturnRequest.order_id == return_data.order_id
    ).first()

    if existing_request:
        raise HTTPException(
            status_code=400,
            detail="A return request already exists for this order"
        )

    if not return_data.reason.strip():
        raise HTTPException(
            status_code=400,
            detail="Return reason cannot be empty"
        )

    new_request = ReturnRequest(
        order_id=return_data.order_id,
        customer_id=current_user.user_id,
        reason=return_data.reason.strip(),
        request_status="pending"
    )

    try:
        db.add(new_request)
        db.commit()
        db.refresh(new_request)

        return new_request

    except Exception:
        db.rollback()
        raise


# =====================================================
# CUSTOMER - VIEW OWN RETURN REQUESTS
# =====================================================

@app.get(
    "/returns/my-returns",
    response_model=list[ReturnRequestResponse]
)
def get_my_returns(
    current_user: User = Depends(
        require_role("customer")
    ),
    db: Session = Depends(get_db)
):

    return db.query(ReturnRequest).filter(
        ReturnRequest.customer_id == current_user.user_id
    ).order_by(
        ReturnRequest.request_date.desc()
    ).all()


# =====================================================
# RESTAURANT OWNER - VIEW INCOMING RETURN REQUESTS
# =====================================================

@app.get(
    "/owner/returns",
    response_model=list[ReturnRequestResponse]
)
def get_owner_returns(
    current_user: User = Depends(
        require_role("restaurant_owner")
    ),
    db: Session = Depends(get_db)
):

    return_requests = (
        db.query(ReturnRequest)
        .join(
            Order,
            ReturnRequest.order_id == Order.order_id
        )
        .join(
            Restaurant,
            Order.restaurant_id == Restaurant.restaurant_id
        )
        .filter(
            Restaurant.owner_id == current_user.user_id
        )
        .order_by(
            ReturnRequest.request_date.desc()
        )
        .all()
    )

    return return_requests


# =====================================================
# RESTAURANT OWNER - APPROVE OR REJECT RETURN REQUEST
# =====================================================

@app.patch("/owner/returns/{request_id}/status")
def update_return_status(
    request_id: int,
    status_data: ReturnStatusUpdate,
    current_user: User = Depends(
        require_role("restaurant_owner")
    ),
    db: Session = Depends(get_db)
):

    try:

        return_request = db.query(ReturnRequest).filter(
            ReturnRequest.request_id == request_id
        ).first()

        if return_request is None:
            raise HTTPException(
                status_code=404,
                detail="Return request not found"
            )

        order = db.query(Order).filter(
            Order.order_id == return_request.order_id
        ).first()

        if order is None:
            raise HTTPException(
                status_code=404,
                detail="Related order not found"
            )

        restaurant = db.query(Restaurant).filter(
            Restaurant.restaurant_id == order.restaurant_id,
            Restaurant.owner_id == current_user.user_id
        ).first()

        if restaurant is None:
            raise HTTPException(
                status_code=403,
                detail="You cannot update this return request"
            )

        if (return_request.request_status or "").lower() != "pending":
            raise HTTPException(
                status_code=400,
                detail="This return request has already been processed"
            )

        new_status = status_data.request_status.lower()

        if new_status == "approved":

            original_payment = db.query(PaymentLedger).filter(
                PaymentLedger.order_id == order.order_id,
                PaymentLedger.transaction_type == "payment",
                PaymentLedger.payment_status == "SUCCESS"
            ).first()

            if original_payment is None:
                raise HTTPException(
                    status_code=400,
                    detail="No successful payment found for this order"
                )

            # Update original payment
            original_payment.payment_status = "refunded"

            # Create separate refund ledger transaction
            refund_record = PaymentLedger(
                order_id=order.order_id,
                amount=original_payment.amount,
                payment_status="refunded",
                transaction_type="refund"
            )

            db.add(refund_record)

        return_request.request_status = new_status

        db.commit()
        db.refresh(return_request)

        return {
            "message": f"Return request {new_status} successfully",
            "request_id": return_request.request_id,
            "request_status": return_request.request_status
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise


# =====================================================
# CUSTOMER - VIEW REMINDERS
# =====================================================

@app.get(
    "/reminders/my-reminders",
    response_model=list[ReminderResponse]
)
def get_my_reminders(
    current_user: User = Depends(
        require_role("customer")
    ),
    db: Session = Depends(get_db)
):

    reminders = (
        db.query(Reminder)
        .join(
            Order,
            Reminder.order_id == Order.order_id
        )
        .filter(
            Order.customer_id == current_user.user_id
        )
        .order_by(
            Reminder.created_at.desc()
        )
        .all()
    )

    return reminders

@app.get("/customer/ai-insights")
def get_ai_order_insights(
    current_user: User = Depends(require_role("customer")),
    db: Session = Depends(get_db)
):
    from collections import Counter

    orders = db.query(Order).filter(
        Order.customer_id == current_user.user_id
    ).order_by(
        Order.order_date.desc()
    ).limit(20).all()

    if not orders:
        return {
            "message": "Place your first order to receive insights!"
        }

    order_history = []
    dish_counter = Counter()
    restaurant_counter = Counter()
    total_spending = 0

    for order in orders:
        restaurant = db.query(Restaurant).filter(
            Restaurant.restaurant_id == order.restaurant_id
        ).first()

        order_items = db.query(OrderItem).filter(
            OrderItem.order_id == order.order_id
        ).all()

        dishes = []

        for order_item in order_items:
            menu_item = db.query(MenuItem).filter(
                MenuItem.item_id == order_item.item_id
            ).first()

            if menu_item:
                dishes.append({
                    "dish": menu_item.item_name,
                    "quantity": order_item.quantity
                })

                dish_counter[menu_item.item_name] += order_item.quantity

        restaurant_name = (
            restaurant.restaurant_name if restaurant else "Unknown"
        )

        restaurant_counter[restaurant_name] += 1
        total_spending += float(order.total_amount)

        order_history.append({
            "restaurant": restaurant_name,
            "dishes": dishes,
            "total_amount": float(order.total_amount),
            "status": order.order_status
        })

    total_orders = len(orders)
    average_order_value = total_spending / total_orders

    favourite_dishes = dish_counter.most_common(3)
    favourite_restaurants = restaurant_counter.most_common(3)

    recommendations = [
        f"You frequently order {dish}. Explore similar dishes!"
        for dish, quantity in favourite_dishes
    ]

    if not recommendations:
        recommendations = [
            "Explore the menu to discover your next favourite dish!"
        ]

    insights = {
        "summary": (
            f"You placed {total_orders} orders and spent "
            f"Rs. {total_spending:.2f} in total."
        ),
        "total_orders": total_orders,
        "total_spending": round(total_spending, 2),
        "average_order_value": round(average_order_value, 2),
        "favourite_dishes": [
            {"dish": dish, "quantity": quantity}
            for dish, quantity in favourite_dishes
        ],
        "favourite_restaurants": [
            {"restaurant": restaurant, "orders": count}
            for restaurant, count in favourite_restaurants
        ],
        "recommendations": recommendations
    }

    return {
        "customer_id": current_user.user_id,
        "total_orders_analysed": total_orders,
        "ai_insights": insights
    }
