# 🚀 SimAPI — Zero Fee SMS API (BYOD Gateway)

![status](https://img.shields.io/badge/status-live-success)
![stack](https://img.shields.io/badge/stack-full--stack-blue)
![license](https://img.shields.io/badge/license-MIT-green)

> **Bring Your Own Device SMS Gateway** — Send SMS using your own Android phone as a backend device.
> No Twilio. No recurring costs. Just your SIM.

---

## 🌐 Live Demo

👉 **Click the image below to open the website**

[![SimAPI Web](https://github.com/user-attachments/assets/d29ce420-1c7a-4625-b1f5-611a79c4b889)](https://sim-api-one.vercel.app)

* 🔗 **Frontend:** https://sim-api-one.vercel.app
* 🔗 **Backend API:** https://simapi-tzyo.onrender.com
* 🔗 **APP:** https://bit.ly/4tuEOUv



---

## 🇮🇳 India-Only Support (Current Limitation)

⚠️ **Important:**
This project is currently optimized for and tested with **Indian mobile numbers only**.

* Works reliably with **Indian SIM cards**
* Designed for **+91 number format**
* SMS delivery depends on local telecom network permissions

---

## 📞 Demo / Test Number

```text
9478045267
```

> ⚠️ Ensure your device is connected and online before sending SMS.

---

## ✨ Features

### 🔐 Authentication

* Email/Password login (Argon2)
* Google OAuth
* GitHub OAuth
* JWT-based authentication

---

### 🔑 API Key System

* Generate secure API keys
* Masked key display (`sim_live_****`)
* Copy-to-clipboard support

---

### 📱 Device Connection (Core Innovation)

* Connect your Android phone via Socket.io
* Real-time device status (🟢 Online / 🔴 Offline)
* Heartbeat-based connection tracking

---

### 📩 SMS Gateway

* Send SMS via API
* Messages routed to connected device
* Queue system with delay (anti-spam)
* Spintax support for duplicate messages

---

### 📊 Dashboard

* API key management
* Device status indicator
* Webhook configuration
* Message logs with delivery status

---

### 🔔 Webhooks

* Receive failure notifications
* Signed webhook requests for security

---

## 🏗️ Tech Stack

### 🧠 Backend

* Node.js + Express
* TypeScript
* Prisma ORM
* PostgreSQL (Supabase)
* Socket.io (real-time communication)
* Passport.js (Google + GitHub OAuth)
* JWT Authentication
* Argon2 (secure password hashing)
* Zod (schema validation)

---

### 🌐 Frontend

* React (Vite)
* Tailwind CSS
* Shadcn UI
* Developer-first SaaS UI (Stripe/Vercel inspired)

---

### 📱 Mobile App

* Flutter (Android)
* Socket.io client
* Native SMS integration
* Foreground service for persistent connection

---

### 🗄️ Infrastructure

* Supabase (Database)
* Prisma Client
* Webhook system

---

### 🚀 Deployment

* Backend: Render
* Frontend: Vercel
* Version Control: GitHub

---

## 📡 Architecture

```text
Frontend (Vercel)
       ↓
Backend API (Render)
       ↓
Socket.io Server
       ↓
Android Device (User’s Phone)
       ↓
SMS sent via SIM 📩
```

---

## 📤 API Example

```http
POST /api/v1/send-sms
Authorization: Bearer <JWT>

{
  "to_number": "9478045267",
  "content": "Hello from SimAPI 🚀"
}
```

---

## ⚙️ Local Setup

### Clone repository

```bash
git clone https://github.com/abeerpathela/SimAPI.git
cd SimAPI
```

---

### Backend

```bash
cd backend
npm install
npm run build
npm start
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## ⚠️ Important Notes

* Requires a connected Android device
* Uses your SIM (BYOD model)
* Works best with Indian telecom networks 🇮🇳
* No third-party SMS provider required

---

## 🧠 Future Improvements

* SMS delivery reports
* Multi-device support
* API analytics dashboard
* Rate limiting & usage tracking
* Play Store deployment

---

## 👨‍💻 Author

**Abeer Pathela**
🔗 https://github.com/abeerpathela

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

---

> Built with 💻 + ☕ by Abeer Pathela
> Designed like a modern developer-first SaaS.
