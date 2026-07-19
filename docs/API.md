# EMS API Documentation

Base URL: `http://localhost:5000/api`

All endpoints except `POST /auth/login` require the `ems_token` httpOnly cookie set by
a successful login. Requests from the frontend must be made with
`credentials: "include"` (already configured in `frontend/src/api/client.ts`).

Error responses use the shape:

```json
{ "message": "Human readable error", "details": { "field": ["reason"] } }
```

`details` is only present on validation (400) errors.

---

## Auth

### `POST /auth/login`
Body:
```json
{ "email": "admin@ems.local", "password": "Admin@12345" }
```
Response `200`:
```json
{ "id": "...", "employeeId": "EMP0001", "name": "Super Admin", "email": "admin@ems.local", "role": "super_admin" }
```
Sets the `ems_token` cookie. Rate-limited to 20 attempts / 15 minutes per IP.

### `POST /auth/logout`
Clears the auth cookie. Response `200`: `{ "message": "Logged out" }`

### `GET /auth/me`
Returns the current authenticated employee (auth required).

---

## Employees
All routes below require authentication. Where noted, a role is required.

### `GET /employees` — Super Admin, HR Manager
Query params (all optional):
| Param | Values |
|---|---|
| `search` | matches name or email, case-insensitive |
| `department` | `Engineering \| Sales \| Marketing \| HR \| Finance \| Support` |
| `role` | `super_admin \| hr_manager \| employee` |
| `status` | `active \| inactive` |
| `sortBy` | `name \| joiningDate` (default `name`) |
| `sortOrder` | `asc \| desc` (default `asc`) |

Example: `GET /employees?search=jane&department=Engineering&sortBy=joiningDate&sortOrder=desc`

### `GET /employees/:id`
Employees may only fetch their own record; Super Admin/HR Manager may fetch any.

### `GET /employees/:id/reportees` — Super Admin, HR Manager
Returns employees whose `reportingManager` is `:id`.

### `POST /employees` — Super Admin, HR Manager
Body:
```json
{
  "name": "Jane Doe",
  "email": "jane@company.com",
  "phone": "9876543210",
  "department": "Engineering",
  "designation": "Software Engineer",
  "salary": 85000,
  "joiningDate": "2026-01-15",
  "status": "active",
  "role": "employee",
  "reportingManager": "<employeeObjectId | null>",
  "password": "min8characters"
}
```
HR Managers get `403` if `role` is `super_admin`. Returns the created employee `201`.

### `PUT /employees/:id`
- Super Admin / HR Manager: may edit any employee (all fields above, `password` optional).
  HR Manager gets `403` on any attempt to touch a Super Admin account or assign the
  Super Admin role.
- Employee: may only PUT their own `id`, and only `phone`, `profileImage`, `password`
  are applied — any other fields in the body are silently ignored server-side.

### `DELETE /employees/:id` — Super Admin only
Blocked with `400` if the employee has direct reports (reassign them first) or if the
requester tries to delete their own account.

### `PATCH /employees/:id/manager` — Super Admin, HR Manager
Body: `{ "managerId": "<employeeObjectId>" }` or `{ "managerId": null }` to clear.
Rejects with `400` if the assignment would create a circular reporting chain or set an
employee as their own manager.

### `POST /employees/:id/photo`
`multipart/form-data` with a single `profileImage` field (JPEG/PNG/WEBP, ≤2MB).
Employees may only upload for their own `id`. Response: `{ "profileImage": "/uploads/xyz.jpg" }`.
Uploaded files are served statically from `/uploads/*`.

---

## Organization

### `GET /organization/tree` — Super Admin, HR Manager
Returns the full hierarchy as a forest of nodes (employees with no manager are roots):
```json
[
  {
    "id": "...",
    "employeeId": "EMP0001",
    "name": "Super Admin",
    "designation": "Super Administrator",
    "department": "HR",
    "reports": [ /* nested nodes, same shape */ ]
  }
]
```

---

## Dashboard

### `GET /dashboard/stats` — Super Admin, HR Manager
```json
{
  "totalEmployees": 12,
  "activeEmployees": 10,
  "inactiveEmployees": 2,
  "departmentCount": 4,
  "departments": [{ "department": "Engineering", "count": 5 }]
}
```
