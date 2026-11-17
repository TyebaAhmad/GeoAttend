# Demo Accounts (frontend only)

There is no backend yet, so `login.html` checks accounts in the browser.
**This is for demo/testing only and is not secure.** It will be replaced by the backend login API.

| Role    | Username / ID | Email                      | Password      | Opens                  |
|---------|---------------|----------------------------|---------------|------------------------|
| Admin   | `admin`       | admin@geoattend.edu        | `Admin@123`   | `admin_dashboard.html` |
| Teacher | `EMP-1001`    | sana.malik@university.edu  | `Teacher@123` | `teacher_portal.html`  |
| Student | `FA25-BCS-005` | bilal.akhtar5@university.edu | `Student@123` | `student_portal.html` |

## Teachers

- Teachers sign in on **`login.html`** by choosing the **Teacher** role (the teacher portal's Logout opens it with Teacher pre-selected).
- **Every active teacher** in the demo data can sign in with their university email
  or employee ID and the demo password `Teacher@123`. Dr. Sana Malik (above) teaches CS301; Dr. Ayesha Khan
  (`ayesha.khan@university.edu`) teaches two courses (AI402, AI310).
- Teachers who **sign up** use the password they chose. Until the admin approves them (Admin → Teachers → Approve)
  the login page says the account is waiting for approval. Inactive teachers cannot sign in.
- A teacher can change their password in **Teacher portal → My Profile** (saved in `localStorage` key `ga_pw_reset`).

## Students

- Students sign in on **`login.html`** by choosing the **Student** role.
- **Every active student** in the demo data can sign in with their university email or roll number and the demo
  password `Student@123`. Bilal Akhtar (above) is a Computer Science student enrolled in CS301, CS205, CS110 and MT105.
- Students who **sign up** use the password they chose, and must be approved by the admin (Admin → Students) first.
- To try **Mark Attendance**: sign in as Dr. Sana Malik in another tab, start CS301 attendance in the teacher portal,
  then in the student portal tap **Check in** → *Simulate: I'm in the classroom* (or use real GPS on a phone).
  If the session needs a QR code, type the 6-character code shown on the teacher's screen.
- The first phone used to check in becomes the student's registered device (key `ga_device_id`).

## Forgot password (demo)

- Click **Forgot password?** on the Sign In screen, enter an email, username or roll number, then enter the 6-digit code and choose a new password.
- There is no email server yet, so the code is shown on screen in a yellow "Demo mode" box.
- A reset of the demo admin password is saved in the browser's `localStorage` (key `ga_pw_reset`). To go back to the original password above, clear site data or run `localStorage.removeItem('ga_pw_reset')` in the browser console.

## How to open

Open `frontend/login.html` in a browser, choose **Admin**, and sign in with the account above.
Opening `admin_dashboard.html` directly without signing in redirects back to the login page.
