from app.db.session import engine
from app.db.base import Base

# Import all models here
from app.models import user

def init_db():
    Base.metadata.create_all(bind=engine)