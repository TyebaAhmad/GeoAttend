# Demo Accounts (frontend only)

There is no backend yet, so `login.html` checks accounts in the browser.
**This is for demo/testing only and is not secure.** It will be replaced by the backend login API.

| Role  | Username | Email               | Password    | Opens                  |
|-------|----------|---------------------|-------------|------------------------|
| Admin | `admin`  | admin@geoattend.edu | `Admin@123` | `admin_dashboard.html` |

## Teachers and students

- Register from the **Sign Up** tab on `login.html`.
- Registered accounts are saved in the browser's `localStorage` (key `ga_users`) for demo purposes only.
- They can sign in with their email (or roll number / employee ID). Their dashboards are not built yet, so they see a "coming soon" message.

## Forgot password (demo)

- Click **Forgot password?** on the Sign In screen, enter an email, username or roll number, then enter the 6-digit code and choose a new password.
- There is no email server yet, so the code is shown on screen in a yellow "Demo mode" box.
- A reset of the demo admin password is saved in the browser's `localStorage` (key `ga_pw_reset`). To go back to the original password above, clear site data or run `localStorage.removeItem('ga_pw_reset')` in the browser console.

## How to open

Open `frontend/login.html` in a browser, choose **Admin**, and sign in with the account above.
Opening `admin_dashboard.html` directly without signing in redirects back to the login page.
