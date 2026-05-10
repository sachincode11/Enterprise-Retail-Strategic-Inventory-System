from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE product_images MODIFY image_url LONGTEXT;"))
    conn.commit()
print("Database altered successfully!")
