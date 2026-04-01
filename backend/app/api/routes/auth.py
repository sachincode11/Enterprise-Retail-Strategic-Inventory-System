from fastapi import APIRouter

router = APIRouter()

@router.post("/login")
def login():
    return {"message": "login working"}

@router.post("/register")
def register():
    return {"message": "register working"}