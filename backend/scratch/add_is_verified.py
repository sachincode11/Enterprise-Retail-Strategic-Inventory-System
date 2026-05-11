import pymysql
from urllib.parse import urlparse

# Manual connection parsing for pymysql
# DATABASE_URL=mysql+pymysql://root:password@localhost/ersis
url = "mysql+pymysql://root:password@localhost/ersis"
parsed = urlparse(url)

user = parsed.username
password = parsed.password
host = parsed.hostname
db = parsed.path.lstrip('/')

try:
    conn = pymysql.connect(host=host, user=user, password=password, database=db)
    with conn.cursor() as cursor:
        # Check if column exists
        cursor.execute("SHOW COLUMNS FROM users LIKE 'is_verified'")
        result = cursor.fetchone()
        if not result:
            print("Adding column 'is_verified' to table 'users'...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column 'is_verified' already exists.")
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()
