# Company Rides - Quick Reference Card for Drivers

## 🎯 What Are Company Rides?

Pre-arranged rides for employees of partner companies. You need an **active contract** with a company to accept their rides.

---

## 📋 Ride Lifecycle (Quick Steps)

### 1️⃣ Receive Notification

- New company ride appears in your app
- Check: Company name, employee, pickup, destination, scheduled time

### 2️⃣ Accept Ride

- Tap "Accept" if you're available
- Your status → "Busy"
- Navigate to pickup location

### 3️⃣ Arrive & Start

- Arrive on time (5-10 min early for scheduled rides)
- Verify employee identity
- Tap "Start Ride"
- Status: Accepted → In Progress

### 4️⃣ Drive to Destination

- Follow the route
- Drive safely and professionally
- Maintain clean vehicle

### 5️⃣ Complete Ride

- Arrive at destination
- Tap "Complete Ride"
- Status: In Progress → Completed
- Your status → "Available"

---

## ⚡ Key Differences from Regular Rides

| Aspect           | Company Rides    | Regular Rides     |
| ---------------- | ---------------- | ----------------- |
| **Payment**      | Company pays     | Passenger pays    |
| **Eligibility**  | Need contract    | All drivers       |
| **Scheduling**   | Often scheduled  | Usually immediate |
| **Expectations** | Higher standards | Standard service  |
| **Tracking**     | Separate section | Main rides        |

---

## ✅ DO's

- ✅ **Be punctual** - Arrive on time, especially for scheduled rides
- ✅ **Be professional** - Clean vehicle, appropriate dress
- ✅ **Verify identity** - Confirm employee name
- ✅ **Communicate** - Call if running late
- ✅ **Follow routes** - Use efficient routes
- ✅ **Respect privacy** - Keep conversations professional

---

## ❌ DON'Ts

- ❌ **Don't be late** - Punctuality is critical
- ❌ **Don't request payment** - Company pays, not employee
- ❌ **Don't smoke** - Never in vehicle
- ❌ **Don't change destination** - Without approval
- ❌ **Don't cancel frequently** - Affects your contract
- ❌ **Don't share info** - Employee details are confidential

---

## 🚨 Common Scenarios

### Employee Not at Pickup

1. Call employee
2. Wait 5-10 minutes
3. Contact company admin
4. Cancel if instructed (reason: "No-show")

### Running Late

1. Call employee immediately
2. Notify company admin
3. Provide ETA
4. Apologize and explain

### Employee Wants to Change Destination

1. Ask them to contact company admin
2. Wait for app confirmation
3. Don't change route without approval

### Vehicle Breakdown

1. Ensure employee safety
2. Notify employee & company admin
3. Arrange alternative transport
4. Cancel ride (reason: "Breakdown")

---

## 📊 Ride Statuses

| Status          | Meaning         | Your Action          |
| --------------- | --------------- | -------------------- |
| **Requested**   | Awaiting driver | Can accept           |
| **Accepted**    | Assigned to you | Navigate to pickup   |
| **In Progress** | Ride started    | Drive to destination |
| **Completed**   | Finished        | Payment processed    |
| **Cancelled**   | Cancelled       | Available again      |
| **Expired**     | Time passed     | No longer available  |

---

## 🔔 Performance Metrics

Companies track:

- ✅ **Acceptance Rate** - Accept rides you can fulfill
- ✅ **On-Time Rate** - Arrive on time
- ✅ **Completion Rate** - Complete accepted rides
- ✅ **Cancellation Rate** - Minimize cancellations
- ✅ **Average Rating** - Provide excellent service
- ✅ **Response Time** - Accept quickly

**Good performance = More rides + Contract renewals + Bonuses**

---

## 📱 API Actions (What the App Does)

```
GET  /api/driver/company-rides          → View all your rides
GET  /api/driver/company-rides/active   → View active ride
POST /api/driver/company-rides/{id}/start    → Start ride
POST /api/driver/company-rides/{id}/complete → Complete ride
POST /api/driver/company-rides/{id}/cancel   → Cancel ride
```

---

## 🎧 Real-Time Events

Your app listens to:

- **Channel:** `drivers`
- **Event:** `.ride.scheduled` - New company ride available

---

## 💰 Payment

- Company pays for all rides
- Your earnings based on contract terms
- **NEVER** request payment from employees
- Check "Earnings" section for company ride income

---

## 🆘 Support

**Technical Issues:**

- Email: driver-support@ecab.com
- Phone: +251-XXX-XXXX
- In-app support chat

**Company Issues:**

- Contact company admin via app
- Reference ride ID

**Emergencies:**

- Call emergency services
- Notify ECAB support
- Document incident

---

## 🏆 Success Tips

### Before Accepting

- ✅ Check scheduled time
- ✅ Verify you can make it
- ✅ Check vehicle condition

### During Ride

- ✅ Professional conduct
- ✅ Safe driving
- ✅ Clean vehicle
- ✅ Respect privacy

### After Ride

- ✅ Confirm completion
- ✅ Ensure employee safety
- ✅ Clean vehicle
- ✅ Ready for next ride

---

## 📝 Quick Checklist

**Every Company Ride:**

- [ ] Accept only if you can fulfill
- [ ] Navigate immediately after accepting
- [ ] Arrive 5-10 min early (scheduled rides)
- [ ] Verify employee identity
- [ ] Start ride when employee is in vehicle
- [ ] Drive safely and professionally
- [ ] Complete ride at destination
- [ ] Maintain vehicle cleanliness

---

## ⚠️ Important Reminders

1. **Contracts Required** - You must have an active contract with the company
2. **No Direct Payment** - Company pays, not the employee
3. **Punctuality Matters** - Especially for scheduled rides
4. **Professional Standards** - Higher expectations than regular rides
5. **Cancellation Impact** - Excessive cancellations affect your contract
6. **Privacy** - Employee information is confidential

---

## 🎯 Goal

Provide **excellent, professional, punctual service** to build long-term relationships with companies and secure consistent income.

---

**Drive safely and professionally! 🚗✨**

_For detailed information, see DRIVER_COMPANY_RIDES_GUIDE.md_
