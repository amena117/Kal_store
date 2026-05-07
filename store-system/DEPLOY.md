# Deployment Guide — cPanel Shared Hosting

## Before You Start
Replace `yourdomain.com` with your actual domain everywhere below.

---

## Step 1 — Create the MySQL Database (cPanel)

1. Login to **cPanel** → **MySQL Databases**
2. Create a new database, e.g. `john_store_db`
3. Create a new database user with a strong password, e.g. `john_dbuser`
4. Add the user to the database with **All Privileges**
5. Go to **phpMyAdmin**, select your new database, click **Import**, and upload `backend/database.sql`

---

## Step 2 — Update Backend Config

Open `backend/config/database.php` and fill in your real credentials:

```php
private $host     = "localhost";
private $db_name  = "john_store_db";   // your cPanel DB name
private $username = "john_dbuser";     // your cPanel DB user
private $password = "YourStrongPass";  // your DB password
```

Also open `backend/api/index.php` and replace:
```php
$allowed_origin = 'https://yourdomain.com';
```

---

## Step 3 — Build the React Frontend

On your local machine, in the `frontend/` folder:

1. Open `.env.production` and set your domain:
   ```
   VITE_API_URL=https://yourdomain.com/api
   ```

2. Run the build:
   ```bash
   npm install
   npm run build
   ```

This creates a `frontend/dist/` folder with all static files.

---

## Step 4 — Upload Files via cPanel File Manager (or FTP)

### Frontend (React build)
Upload everything inside `frontend/dist/` to:
```
public_html/
```
This includes `index.html`, `assets/`, `.htaccess`, etc.

### Backend (PHP API)
Upload the entire `backend/` folder to:
```
public_html/backend/
```

Your final structure on the server should look like:
```
public_html/
├── index.html          ← React app entry
├── assets/             ← React JS/CSS bundles
├── .htaccess           ← React router fix
└── backend/
    ├── api/
    │   ├── index.php
    │   └── .htaccess
    ├── config/
    │   └── database.php
    ├── controllers/
    ├── models/
    ├── helpers/
    └── uploads/
```

---

## Step 5 — Set Uploads Folder Permissions

In cPanel **File Manager**, right-click the `backend/uploads/` folder:
- Set permissions to **755** (or **775** if uploads fail)

---

## Step 6 — Test

1. Visit `https://yourdomain.com` — you should see the login page
2. Visit `https://yourdomain.com/api/auth/login` in browser — should return a JSON error (not a 404)
3. Login with your admin credentials

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Blank page after login | Check `.htaccess` is uploaded to `public_html/` |
| API returns 404 | Check `backend/api/.htaccess` is uploaded |
| Database error | Double-check credentials in `database.php` |
| Images not uploading | Set `uploads/` folder permission to 755 |
| CORS error in browser | Make sure `yourdomain.com` is set correctly in `api/index.php` |
