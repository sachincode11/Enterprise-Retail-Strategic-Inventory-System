from app.db import Base, engine

# Import all models here
from app.models import models

def init_db():
    Base.metadata.create_all(bind=engine)