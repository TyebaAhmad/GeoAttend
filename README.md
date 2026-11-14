# GeoAttend

**A GPS-Based Smart Attendance Management System for Universities**

GeoAttend is a web/mobile application that lets students mark attendance using their smartphone's location instead of traditional manual roll calls. Using GPS and geofencing, the system verifies that a student is physically present within the classroom or campus before accepting their attendance.

> Final Year Project (FYP)

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Modules](#modules)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Future Enhancements](#future-enhancements)
- [Conclusion](#conclusion)

---

## Overview

Manual attendance wastes class time and is prone to proxy attendance and errors. GeoAttend solves this by:

- Letting teachers start time-bound attendance sessions linked to a location.
- Allowing students to mark attendance from their phones only when they are inside a permitted geographical area (geofence).
- Storing every attendance record with student ID, date, time, and location.
- Giving administrators and teachers accurate, easily accessible attendance reports.

## How It Works

1. The **teacher** logs in and starts an attendance session.
2. The system defines the permitted **location** (classroom or campus) and radius.
3. **Students** open the application on their smartphones.
4. The application accesses the student's **GPS location** (with permission).
5. The **backend** checks whether the student is within the permitted attendance radius.
6. If the location is valid and the session is active, the student's attendance is **marked**.
7. Attendance is **saved** in the database with student ID, date, time, and location.

```
Teacher starts session ──► Student opens app ──► GPS location captured
                                                        │
                                                        ▼
        Attendance saved ◄── Inside geofence & session active? ──► Rejected
```

## Modules

| Module | Purpose |
|---|---|
| **Admin Dashboard** | Manage students, teachers, courses, and attendance records. |
| **Teacher Dashboard** | Start attendance sessions and monitor students. |
| **Student Dashboard** | Mark attendance and view attendance history. |
| **GPS Location Verification** | Verify whether students are inside the allowed location. |
| **Geofencing** | Set a virtual geographical boundary around the classroom or campus. |
| **Attendance Management** | Store present, absent, and late records. |
| **Reports & Analytics** | Generate daily, weekly, and monthly attendance reports. |
| **Notifications** | Notify students about attendance sessions and low attendance. |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, HTML, CSS, JavaScript, Bootstrap |
| Backend | Python — Flask or FastAPI |
| Database | MySQL or Firebase |
| GPS | Smartphone GPS / Browser Geolocation API |
| Maps | Google Maps API or Leaflet |
| Location Verification | Geofencing |
| API Testing | Postman |
| Development | VS Code, Git, GitHub |

## Project Structure

_The structure will be finalized as modules are developed. Planned layout:_

```
GeoAttend/
├── frontend/      # React.js client (admin, teacher, student dashboards)
├── backend/       # Python API (auth, sessions, geofencing, attendance, reports)
├── docs/          # Project documentation and diagrams
└── README.md
```

## Getting Started

_Setup instructions will be added as the frontend and backend are implemented._

### Prerequisites

- Node.js and npm (frontend)
- Python 3.10+ (backend)
- MySQL server or a Firebase project
- Git

## Future Enhancements

- **Dynamic QR code verification** as a second factor alongside GPS, to reduce location spoofing.
- **Real-time attendance monitoring** for teachers during an active session.
- **Automated reports** delivered on a schedule.

## Conclusion

GeoAttend provides an efficient, modern solution for managing student attendance in universities. By using GPS technology and geofencing, it verifies students' locations and only allows attendance within a predefined area. The system reduces manual effort, saves classroom time, improves attendance accuracy, and gives teachers and administrators reliable, accessible attendance records.
