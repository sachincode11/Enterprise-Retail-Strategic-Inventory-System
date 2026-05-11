import sys

file_path = r"c:\Users\sachi\OneDrive\Desktop\Systems Development Group Project\Enterprise-Retail-Strategic-Inventory-System\backend\app\routers\auth.py"

with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
inserted = False
for line in lines:
    if '@router.post("/refresh"' in line and not inserted:
        new_lines.append('\n@router.get("/me")\n')
        new_lines.append('def get_my_profile(\n')
        new_lines.append('    current_user: User = Depends(get_current_user),\n')
        new_lines.append('    db: Session = Depends(get_db),\n')
        new_lines.append('):\n')
        new_lines.append('    """Fetch the currently authenticated user\'s profile details."""\n')
        new_lines.append('    return {"user": _session_user_payload(db, current_user)}\n\n')
        inserted = True
    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Done")
