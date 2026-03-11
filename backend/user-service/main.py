from uuid import UUID
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import init_db, get_db, User, Portfolio
from auth import hash_password, verify_password, create_access_token, decode_access_token
from schemas import RegisterRequest, LoginRequest, UserResponse, AuthResponse

app = FastAPI(title="WealthBeing User Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


def get_token_user_id(authorization: str | None) -> UUID:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.split(" ", 1)[1]
    raw = decode_access_token(token)
    if not raw:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    try:
        return UUID(raw)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/register", response_model=AuthResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name.strip() or body.email.split("@")[0],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id))
    return AuthResponse(
        user=UserResponse(id=str(user.id), email=user.email, name=user.name),
        access_token=token,
    )


@app.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user.id))
    return AuthResponse(
        user=UserResponse(id=str(user.id), email=user.email, name=user.name),
        access_token=token,
    )


@app.get("/me", response_model=UserResponse)
def me(authorization: str | None = Header(None, alias="Authorization"), db: Session = Depends(get_db)):
    user_id = get_token_user_id(authorization)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(id=str(user.id), email=user.email, name=user.name)


@app.get("/portfolio")
def get_portfolio(authorization: str | None = Header(None, alias="Authorization"), db: Session = Depends(get_db)):
    user_id = get_token_user_id(authorization)
    row = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="No portfolio saved")
    return row.data


@app.put("/portfolio")
def put_portfolio(body: dict, authorization: str | None = Header(None, alias="Authorization"), db: Session = Depends(get_db)):
    user_id = get_token_user_id(authorization)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Frontend sends { portfolio: {...}, month: "...", wws: ... } — extract just the portfolio object
    portfolio_data = body.get("portfolio", body)
    row = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    if row:
        row.data = portfolio_data
        db.commit()
        db.refresh(row)
    else:
        row = Portfolio(user_id=user_id, data=portfolio_data)
        db.add(row)
        db.commit()
        db.refresh(row)
    return {"ok": True}

