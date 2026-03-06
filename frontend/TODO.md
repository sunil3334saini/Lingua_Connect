# Lingua Connect — Frontend TODO

## ✅ Completed
- [x] Next.js project setup (TypeScript, Tailwind CSS, App Router)
- [x] Dependencies (axios, socket.io-client, zustand, react-hot-toast, lucide-react)
- [x] API client with auth interceptor (`lib/api.ts`)
- [x] Socket.io client (`lib/socket.ts`)
- [x] Auth store with Zustand (`store/authStore.ts`)
- [x] TypeScript types (`types/index.ts`)
- [x] Navbar component
- [x] Providers wrapper (Toaster + Navbar)
- [x] Home page (landing page with hero, features, CTA)
- [x] Login page with form
- [x] Register page with role selection (student/teacher)
- [x] Dashboard page (stats, quick actions, upcoming sessions)
- [x] Teachers listing page (search + filter + pagination)
- [x] Teacher detail page (profile + booking form + reviews)
- [x] Teacher setup page (create/edit teaching profile)
- [x] Booking detail page (with Razorpay payment integration)
- [x] Bookings list page (with filter tabs)
- [x] Video call page (WebRTC + Socket.io signaling + in-call chat)
- [x] Profile page (edit personal details)
- [x] Environment config (`.env.local`)

## 🔧 In Progress / TODO
- [ ] Mobile responsive hamburger menu
- [ ] Loading skeletons across all pages
- [ ] Protected route wrapper component
- [ ] Teacher availability calendar component
- [ ] Session recording UI
- [ ] Admin panel pages
- [ ] Notification bell with real-time updates
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Dark mode support
- [ ] Image upload for profile pictures
- [ ] SEO meta tags per page
- [ ] Error boundary components
- [ ] 404 page
- [ ] Progressive Web App (PWA) setup
- [ ] End-to-end tests (Cypress / Playwright)
- [ ] Analytics dashboard for teachers
- [ ] Class reminder notification

## 📁 Frontend Structure
```
frontend/src/
├── app/
│   ├── page.tsx              (Home/Landing)
│   ├── layout.tsx            (Root layout)
│   ├── globals.css
│   ├── login/page.tsx        (Login)
│   ├── register/page.tsx     (Register)
│   ├── dashboard/page.tsx    (Dashboard)
│   ├── teachers/page.tsx     (Browse Teachers)
│   ├── teacher/
│   │   ├── [id]/page.tsx     (Teacher Detail)
│   │   └── setup/page.tsx    (Teacher Profile Setup)
│   ├── booking/
│   │   └── [id]/page.tsx     (Booking Detail + Payment)
│   ├── bookings/page.tsx     (My Bookings List)
│   ├── call/
│   │   └── [roomId]/page.tsx (Video Call + Chat)
│   └── profile/page.tsx      (Edit Profile)
├── components/
│   ├── Navbar.tsx
│   └── Providers.tsx
├── lib/
│   ├── api.ts                (Axios instance)
│   └── socket.ts             (Socket.io client)
├── store/
│   └── authStore.ts          (Zustand auth store)
└── types/
    └── index.ts              (TypeScript interfaces)
```

## 📄 Pages Summary
| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with hero, features, CTA |
| Login | `/login` | Email + password login |
| Register | `/register` | Registration with role selection |
| Dashboard | `/dashboard` | Stats, quick actions, upcoming sessions |
| Find Teachers | `/teachers` | Search, filter, browse teachers |
| Teacher Detail | `/teacher/[id]` | Profile, reviews, booking form |
| Teacher Setup | `/teacher/setup` | Create/edit teaching profile |
| Booking Detail | `/booking/[id]` | Details + Razorpay payment |
| My Bookings | `/bookings` | List with filter tabs |
| Video Call | `/call/[roomId]` | WebRTC video + chat |
| Profile | `/profile` | Edit personal details |
