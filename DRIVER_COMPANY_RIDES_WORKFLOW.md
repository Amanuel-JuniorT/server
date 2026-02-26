# Company Rides - Driver Workflow Diagram

## 📊 Complete Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COMPANY RIDE LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  Company Admin  │
│  Schedules Ride │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          RIDE CREATED                                   │
│  Status: REQUESTED                                                      │
│  • Broadcast to all contracted drivers                                  │
│  • Event: .ride.scheduled on 'drivers' channel                         │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DRIVER RECEIVES NOTIFICATION                       │
│  Driver sees:                                                           │
│  • Company name                                                         │
│  • Employee name & contact                                              │
│  • Pickup address                                                       │
│  • Destination address                                                  │
│  • Scheduled time (if applicable)                                       │
│  • Price                                                                │
└────────┬───────────────────────────────────────┬────────────────────────┘
         │                                       │
         │ ACCEPT                                │ DECLINE / IGNORE
         ▼                                       ▼
┌─────────────────────────────────────┐  ┌──────────────────────────────┐
│     RIDE ACCEPTED BY DRIVER         │  │  Ride remains REQUESTED      │
│  Status: ACCEPTED                   │  │  • Reassigned to other       │
│  • Driver status → Busy             │  │    drivers                   │
│  • Navigate to pickup               │  │  • Or expires if no accept   │
│  • Employee notified                │  └──────────────────────────────┘
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DRIVER NAVIGATES TO PICKUP                           │
│  Driver actions:                                                        │
│  • Use GPS navigation                                                   │
│  • Call employee if needed                                              │
│  • Arrive 5-10 min early (scheduled rides)                             │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DRIVER ARRIVES AT PICKUP                             │
│  Driver actions:                                                        │
│  • Verify employee identity                                             │
│  • Ensure employee is in vehicle                                        │
│  • Tap "START RIDE" button                                              │
│                                                                          │
│  API: POST /api/driver/company-rides/{id}/start                        │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          RIDE STARTED                                   │
│  Status: IN_PROGRESS                                                    │
│  • started_at timestamp recorded                                        │
│  • Employee & company notified                                          │
│  • Real-time tracking active                                            │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DRIVER DRIVES TO DESTINATION                         │
│  Driver responsibilities:                                               │
│  • Drive safely                                                         │
│  • Follow efficient route                                               │
│  • Professional conduct                                                 │
│  • Maintain clean vehicle                                               │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  DRIVER ARRIVES AT DESTINATION                          │
│  Driver actions:                                                        │
│  • Confirm correct destination                                          │
│  • Ensure employee exits safely                                         │
│  • Tap "COMPLETE RIDE" button                                           │
│                                                                          │
│  API: POST /api/driver/company-rides/{id}/complete                     │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          RIDE COMPLETED                                 │
│  Status: COMPLETED                                                      │
│  • completed_at timestamp recorded                                      │
│  • Driver status → Available                                            │
│  • Company billed                                                       │
│  • Driver paid per contract                                             │
│  • Employee & company notified                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔀 Alternative Paths

### Path 1: Driver Cancellation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RIDE ACCEPTED or IN_PROGRESS                         │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         │ Driver needs to cancel (emergency, breakdown, etc.)
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DRIVER CANCELS RIDE                                  │
│  • Tap "Cancel Ride"                                                    │
│  • Provide reason (optional)                                            │
│  • Confirm cancellation                                                 │
│                                                                          │
│  API: POST /api/driver/company-rides/{id}/cancel                       │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          RIDE CANCELLED                                 │
│  Status: CANCELLED                                                      │
│  • Driver status → Available                                            │
│  • Ride reassigned to another driver                                    │
│  • Employee & company notified                                          │
│  • No payment to driver                                                 │
│  • Cancellation recorded (affects metrics)                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Path 2: Employee No-Show

```
┌─────────────────────────────────────────────────────────────────────────┐
│              DRIVER ARRIVES AT PICKUP - EMPLOYEE ABSENT                 │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DRIVER ATTEMPTS CONTACT                              │
│  • Call employee phone                                                  │
│  • Send message via app                                                 │
│  • Wait 5-10 minutes                                                    │
└────────┬───────────────────────────────┬────────────────────────────────┘
         │                               │
         │ Employee responds             │ No response
         ▼                               ▼
┌──────────────────────────┐    ┌────────────────────────────────────────┐
│  Proceed with ride       │    │  Contact company admin                 │
│  Start normally          │    │  • Report no-show                      │
└──────────────────────────┘    │  • Get instructions                    │
                                │  • Cancel if instructed                │
                                │  • Document incident                   │
                                └────────────────────────────────────────┘
```

### Path 3: Scheduled Ride Expiration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCHEDULED RIDE CREATED                               │
│  Status: REQUESTED                                                      │
│  scheduled_time: 2025-11-30 14:00:00                                   │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         │ Time passes, no driver accepts
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              SCHEDULED TIME PASSES WITHOUT ACCEPTANCE                   │
│  • Current time > scheduled_time                                        │
│  • Status still REQUESTED                                               │
│  • Automatic expiry job runs                                            │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          RIDE EXPIRED                                   │
│  Status: EXPIRED                                                        │
│  • No longer available to drivers                                       │
│  • Company & employee notified                                          │
│  • May be rescheduled by company                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Driver Decision Points

```
                    ┌─────────────────────┐
                    │  Ride Notification  │
                    │     Received        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Can I fulfill      │
                    │  this ride?         │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │                             │
           YES  ▼                             ▼  NO
    ┌──────────────────┐           ┌──────────────────┐
    │  Check Schedule  │           │  Don't Accept    │
    │  • Time          │           │  • Let others    │
    │  • Location      │           │    accept        │
    │  • Vehicle ready │           └──────────────────┘
    └────────┬─────────┘
             │
    ┌────────▼─────────┐
    │  All good?       │
    └────────┬─────────┘
             │
    ┌────────┼────────┐
    │                 │
YES ▼                 ▼ NO
┌─────────┐     ┌──────────┐
│ ACCEPT  │     │ DECLINE  │
└─────────┘     └──────────┘
```

---

## 📱 Driver App State Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DRIVER APP STATES                               │
└─────────────────────────────────────────────────────────────────────────┘

    AVAILABLE                    BUSY                      AVAILABLE
        │                         │                            │
        │                         │                            │
        ▼                         ▼                            ▼
┌───────────────┐         ┌──────────────┐           ┌────────────────┐
│  Waiting for  │ Accept  │  Ride Active │ Complete  │  Ready for     │
│  Ride Request │────────▶│  (Accepted/  │──────────▶│  Next Ride     │
│               │         │  In Progress)│           │                │
└───────────────┘         └──────┬───────┘           └────────────────┘
                                 │
                                 │ Cancel
                                 ▼
                          ┌──────────────┐
                          │  Available   │
                          │  Again       │
                          └──────────────┘
```

---

## 🔔 Notification Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      REAL-TIME NOTIFICATIONS                            │
└─────────────────────────────────────────────────────────────────────────┘

Company Admin                     Driver                        Employee
     │                             │                               │
     │ Schedules Ride              │                               │
     ├─────────────────────────────┼──────────────────────────────▶│
     │                             │                               │
     │                             │ Receives Notification         │
     │                             │ (.ride.scheduled)             │
     │                             │                               │
     │                             │ Accepts Ride                  │
     │◀────────────────────────────┼──────────────────────────────▶│
     │ (Driver assigned)           │                               │
     │                             │                               │
     │                             │ Starts Ride                   │
     │◀────────────────────────────┼──────────────────────────────▶│
     │ (Ride in progress)          │                               │
     │                             │                               │
     │                             │ Completes Ride                │
     │◀────────────────────────────┼──────────────────────────────▶│
     │ (Ride completed)            │                               │
     │                             │                               │
```

---

## 💡 Key Integration Points

### 1. WebSocket Connection

```
Driver App
    │
    ├─ Connect to WebSocket
    │  └─ Channel: 'drivers'
    │
    ├─ Listen for Events
    │  ├─ .ride.scheduled
    │  ├─ .company-ride.driver-assigned
    │  └─ .ride.status-changed
    │
    └─ Handle Events
       └─ Update UI, Show notifications
```

### 2. API Interactions

```
Driver App                          Backend API
    │                                   │
    ├─ GET /api/driver/company-rides ──▶│ Fetch all rides
    │◀─────────────────────────────────┤
    │                                   │
    ├─ POST /api/driver/company-rides/{id}/start
    │◀─────────────────────────────────┤ Update status
    │                                   │
    ├─ POST /api/driver/company-rides/{id}/complete
    │◀─────────────────────────────────┤ Update status
    │                                   │
```

### 3. Status Transitions

```
REQUESTED ──(driver accepts)──▶ ACCEPTED ──(driver starts)──▶ IN_PROGRESS ──(driver completes)──▶ COMPLETED
    │                              │                               │
    │                              │                               │
    └──(time expires)──▶ EXPIRED   └──(driver cancels)──▶ CANCELLED
                                                                   ▲
                                                                   │
                                                    (driver cancels)
```

---

## 📊 Performance Tracking

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      DRIVER PERFORMANCE METRICS                         │
└─────────────────────────────────────────────────────────────────────────┘

Acceptance Rate = (Rides Accepted / Rides Offered) × 100%
    │
    ├─ Good: > 80%
    ├─ Fair: 60-80%
    └─ Poor: < 60%

Cancellation Rate = (Rides Cancelled / Rides Accepted) × 100%
    │
    ├─ Good: < 5%
    ├─ Fair: 5-10%
    └─ Poor: > 10%

On-Time Rate = (On-Time Arrivals / Total Scheduled Rides) × 100%
    │
    ├─ Good: > 90%
    ├─ Fair: 80-90%
    └─ Poor: < 80%

Completion Rate = (Rides Completed / Rides Accepted) × 100%
    │
    ├─ Good: > 95%
    ├─ Fair: 90-95%
    └─ Poor: < 90%
```

---

## 🎓 Training Checklist

**Before Starting Company Rides:**

- [ ] Understand what company rides are
- [ ] Know how to check your contracts
- [ ] Understand the ride lifecycle
- [ ] Know how to accept/decline rides
- [ ] Understand scheduled vs immediate rides
- [ ] Know how to start a ride
- [ ] Know how to complete a ride
- [ ] Know when and how to cancel
- [ ] Understand payment process
- [ ] Know professional conduct expectations
- [ ] Understand performance metrics
- [ ] Know how to handle common scenarios
- [ ] Have support contact information
- [ ] Understand real-time notifications

---

## 📞 Quick Support Reference

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SUPPORT CONTACTS                              │
└─────────────────────────────────────────────────────────────────────────┘

Technical Issues
├─ Email: driver-support@ecab.com
├─ Phone: +251-XXX-XXXX
└─ In-app: Support Chat

Company Issues
├─ Contact: Company Admin (via app)
└─ Reference: Ride ID

Emergencies
├─ Emergency Services: 911
├─ ECAB Support: Immediate notification
└─ Document: All incidents
```

---

**For detailed information, refer to:**

- `DRIVER_COMPANY_RIDES_GUIDE.md` - Complete guide
- `DRIVER_COMPANY_RIDES_QUICK_REFERENCE.md` - Quick reference card
