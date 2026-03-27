from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_products():
    return {"message": "all products"}

@router.post("/")
def create_product():
    return {"message": "product created"}