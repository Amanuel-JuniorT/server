# Company Rides Driver Training - Presentation Outline

## 🎯 Training Objectives

By the end of this training, drivers will:

1. Understand what company rides are and how they differ from regular rides
2. Know how to accept, start, and complete company rides
3. Understand professional expectations and best practices
4. Know how to handle common scenarios and issues
5. Understand performance metrics and their impact

---

## 📚 Training Modules

### Module 1: Introduction to Company Rides (15 minutes)

#### What Are Company Rides?

- Pre-arranged transportation for company employees
- Partnership between ECAB and businesses
- Separate from regular passenger rides
- Opportunity for consistent, professional income

#### Key Differences from Regular Rides

| Feature     | Company Rides         | Regular Rides     |
| ----------- | --------------------- | ----------------- |
| Payment     | Company pays          | Passenger pays    |
| Scheduling  | Often scheduled ahead | Usually immediate |
| Eligibility | Contract required     | All drivers       |
| Standards   | Higher expectations   | Standard service  |
| Tracking    | Separate system       | Main system       |

#### Benefits for Drivers

- ✅ Consistent income from contracts
- ✅ Professional clientele
- ✅ Scheduled rides (plan your day)
- ✅ No payment collection hassle
- ✅ Potential for long-term relationships
- ✅ Performance bonuses

#### Requirements

- Active driver account
- Contract with at least one company
- Good driving record
- Professional conduct
- Reliable vehicle

---

### Module 2: Driver Contracts (10 minutes)

#### What Is a Driver Contract?

- Agreement between you and a company
- Authorizes you to serve their employees
- Defines payment terms and expectations
- Has start and end dates

#### How to Get Contracts

- Companies select drivers based on:
    - Performance metrics
    - Ratings
    - Availability
    - Vehicle condition
    - Professional conduct
- Maintain excellent service to get more contracts

#### Managing Your Contracts

- **View Contracts**: Check in "Company Contracts" section
- **Active Contracts**: Currently valid
- **Pending Contracts**: Awaiting approval
- **Expired Contracts**: Past contracts

#### Contract Terms

- Payment rate (per ride, hourly, or monthly)
- Service area
- Availability requirements
- Performance expectations
- Contract duration

**💡 Demo:** Show how to view contracts in the driver app

---

### Module 3: The Company Ride Lifecycle (20 minutes)

#### Step 1: Receiving Notifications

- Ride appears in your app
- Push notification sent
- Real-time via WebSocket (channel: `drivers`)
- Event: `.ride.scheduled`

**What You'll See:**

```
New Company Ride
Company: Acme Corporation
Employee: John Doe
Pickup: Bole, Addis Ababa
Destination: Meskel Square
Scheduled: Today, 2:00 PM
Price: 150 ETB
```

**💡 Demo:** Show notification in app

#### Step 2: Accepting the Ride

- Review ride details
- Check if you can fulfill it
- Tap "Accept" button
- Your status changes to "Busy"

**Before Accepting, Ask Yourself:**

- ✅ Can I reach the pickup on time?
- ✅ Is my vehicle ready?
- ✅ Do I have enough time?
- ✅ Am I available for the duration?

**💡 Demo:** Accept a ride in the app

#### Step 3: Navigating to Pickup

- Use GPS navigation
- Arrive 5-10 minutes early (scheduled rides)
- Call employee if needed
- Find the exact pickup location

**Tips:**

- Check traffic conditions
- Plan your route
- Contact employee if you'll be late
- Park safely at pickup location

**💡 Demo:** Show navigation feature

#### Step 4: Starting the Ride

- Verify employee identity (ask for name)
- Ensure employee is in vehicle
- Tap "Start Ride" button
- Status changes to "In Progress"

**What Happens:**

- `started_at` timestamp recorded
- Company and employee notified
- Real-time tracking begins
- Ride timer starts

**💡 Demo:** Start a ride in the app

#### Step 5: Driving to Destination

- Follow the route
- Drive safely and professionally
- Maintain clean vehicle
- Professional conversation

**During the Ride:**

- ✅ Safe driving
- ✅ Efficient route
- ✅ Professional conduct
- ✅ Comfortable environment
- ✅ Respect privacy

#### Step 6: Completing the Ride

- Arrive at destination
- Ensure employee exits safely
- Tap "Complete Ride" button
- Status changes to "Completed"

**What Happens:**

- `completed_at` timestamp recorded
- Your status returns to "Available"
- Company is billed
- You're paid per contract terms
- Company and employee notified

**💡 Demo:** Complete a ride in the app

---

### Module 4: Professional Standards (15 minutes)

#### Appearance & Vehicle

- **Driver:**
    - Clean, appropriate clothing
    - Good personal hygiene
    - Professional demeanor
- **Vehicle:**
    - Clean interior and exterior
    - No unpleasant odors
    - Functioning AC/heating
    - Safe and well-maintained

#### Punctuality

- **Critical for company rides!**
- Arrive 5-10 minutes early for scheduled rides
- Plan for traffic delays
- Call if running late
- Never make employee wait

#### Communication

- **Professional and courteous**
- Greet employee politely
- Confirm destination
- Ask about route preferences
- Keep conversation professional
- Respect if employee wants quiet

#### Conduct

- ✅ Respectful and courteous
- ✅ Patient and understanding
- ✅ Professional at all times
- ❌ No smoking
- ❌ No phone use while driving
- ❌ No inappropriate conversations
- ❌ No requesting tips/payment

#### Privacy & Confidentiality

- Employee information is confidential
- Don't share ride details
- Don't discuss other passengers
- Respect employee's privacy
- Don't ask personal questions

**💡 Role Play:** Practice professional greetings and interactions

---

### Module 5: Handling Common Scenarios (20 minutes)

#### Scenario 1: Employee Not at Pickup

**What to do:**

1. Call employee's phone number
2. Wait 5-10 minutes at location
3. Send message via app
4. Contact company admin if no response
5. Document the no-show
6. Cancel ride if instructed (reason: "No-show")

**💡 Role Play:** Practice handling no-show

#### Scenario 2: Running Late

**What to do:**

1. Call employee immediately
2. Notify company admin via app
3. Provide accurate ETA
4. Apologize and explain briefly
5. Drive safely (don't speed to make up time)

**Prevention:**

- Leave early for scheduled rides
- Check traffic before accepting
- Plan your route in advance

**💡 Discussion:** Share experiences with traffic delays

#### Scenario 3: Employee Wants to Change Destination

**What to do:**

1. Politely explain changes must be through the app
2. Ask employee to contact company admin
3. Wait for app confirmation
4. Don't change route without approval

**Why:**

- Billing accuracy
- Company tracking
- Your protection
- Proper documentation

#### Scenario 4: Employee Wants to Make a Stop

**What to do:**

1. Check if stops are allowed in your contract
2. If allowed, make brief stops as requested
3. Keep ride timer running
4. Document extended stops
5. If not allowed, politely explain company policy

#### Scenario 5: Vehicle Breakdown

**What to do:**

1. Ensure employee safety first
2. Move to safe location if possible
3. Call emergency services if needed
4. Notify employee and company admin immediately
5. Arrange alternative transportation for employee
6. Cancel ride with reason "Vehicle breakdown"
7. Document the incident

**Prevention:**

- Regular vehicle maintenance
- Pre-trip inspections
- Keep emergency kit in vehicle

#### Scenario 6: Difficult or Rude Employee

**What to do:**

1. Remain calm and professional
2. Don't argue or escalate
3. Focus on safe driving
4. Document the incident
5. Report to company admin after ride
6. Complete ride professionally

**Remember:**

- You represent ECAB and the company
- Professional conduct always
- Your safety is priority

**💡 Role Play:** Practice handling difficult situations

---

### Module 6: Payment & Earnings (10 minutes)

#### How Payment Works

- Company is billed for each completed ride
- You're paid according to contract terms
- Payment processed automatically
- No cash handling required

#### Payment Models

1. **Per Ride:** Fixed amount per completed ride
2. **Hourly:** Based on time spent on rides
3. **Monthly:** Fixed monthly payment for availability
4. **Hybrid:** Combination of above

#### Viewing Your Earnings

- Check "Earnings" section in app
- Company rides tracked separately
- See breakdown by company
- View payment history

#### Important Rules

- ❌ **NEVER** request payment from employee
- ❌ **NEVER** accept cash from employee
- ❌ **NEVER** request tips
- ✅ All payments through ECAB system
- ✅ Questions? Contact support

**💡 Demo:** Show earnings section in app

---

### Module 7: Performance Metrics (15 minutes)

#### Why Metrics Matter

- Companies track your performance
- Affects contract renewals
- Determines ride assignments
- Impacts bonuses and incentives

#### Key Metrics

**1. Acceptance Rate**

- Formula: (Rides Accepted / Rides Offered) × 100%
- Target: > 80%
- Impact: Higher rate = more ride offers

**2. Cancellation Rate**

- Formula: (Rides Cancelled / Rides Accepted) × 100%
- Target: < 5%
- Impact: High rate = fewer offers, contract risk

**3. On-Time Rate**

- Formula: (On-Time Arrivals / Total Scheduled Rides) × 100%
- Target: > 90%
- Impact: Critical for scheduled rides

**4. Completion Rate**

- Formula: (Rides Completed / Rides Accepted) × 100%
- Target: > 95%
- Impact: Shows reliability

**5. Average Rating**

- Employee ratings (1-5 stars)
- Target: > 4.5 stars
- Impact: Affects contract offers

**6. Response Time**

- How quickly you accept rides
- Target: < 30 seconds
- Impact: Faster = more assignments

#### Improving Your Metrics

- ✅ Only accept rides you can fulfill
- ✅ Arrive on time (or early)
- ✅ Complete all accepted rides
- ✅ Provide excellent service
- ✅ Minimize cancellations
- ✅ Respond quickly to requests

**💡 Demo:** Show performance dashboard in app

---

### Module 8: Scheduled vs. Immediate Rides (10 minutes)

#### Scheduled Rides

**Characteristics:**

- Have a specific scheduled time
- May be hours or days in advance
- Often recurring (daily commutes)
- Require advance planning

**Time Labels:**

- **Today:** Scheduled for today
- **Upcoming:** Future date
- **Past:** Time passed but still active
- **Expired:** Time passed, never accepted

**Best Practices:**

- Accept early if possible
- Plan your schedule around it
- Arrive 5-10 minutes early
- Set reminders
- Check traffic in advance

#### Immediate Rides

**Characteristics:**

- No scheduled time (or "now")
- Similar to regular rides
- Need quick response
- Proximity-based assignment

**Best Practices:**

- Accept quickly
- Navigate immediately
- Contact employee if needed
- Standard ride procedures

**💡 Demo:** Show both types in app

---

### Module 9: Cancellations (10 minutes)

#### When to Cancel

**Valid Reasons:**

- Emergency situation
- Vehicle breakdown
- Unable to reach pickup (road closure)
- Safety concerns
- Employee no-show (after waiting)

**Invalid Reasons:**

- Changed your mind
- Found a better ride
- Don't like the destination
- Employee seems difficult

#### How to Cancel

1. Tap "Cancel Ride" button
2. Select reason from dropdown
3. Add notes (optional but recommended)
4. Confirm cancellation

**What Happens:**

- Your status returns to "Available"
- Ride is reassigned
- Cancellation is recorded
- Affects your metrics

#### Consequences

- **Occasional:** Understandable, minimal impact
- **Frequent:** Warnings, fewer assignments
- **Excessive:** Contract termination

**Cancellation Rate Targets:**

- Good: < 5%
- Fair: 5-10%
- Poor: > 10%

**💡 Discussion:** When is cancellation appropriate?

---

### Module 10: Technical Aspects (10 minutes)

#### Real-Time Notifications

- **Channel:** `drivers`
- **Event:** `.ride.scheduled`
- **Requires:** Active internet connection
- **Ensure:** App is running in background

#### API Endpoints (What the App Does)

```
GET  /api/driver/company-rides          → View all rides
GET  /api/driver/company-rides/active   → View active ride
POST /api/driver/company-rides/{id}/start    → Start ride
POST /api/driver/company-rides/{id}/complete → Complete ride
POST /api/driver/company-rides/{id}/cancel   → Cancel ride
```

#### Ride Statuses

- **Requested:** Awaiting driver
- **Accepted:** Assigned to you
- **In Progress:** Ride started
- **Completed:** Ride finished
- **Cancelled:** Ride cancelled
- **Expired:** Time passed, not accepted

#### Troubleshooting

**Can't see company rides?**

- Check contracts (must be active)
- Verify driver status is "available"
- Check internet connection
- Restart app

**Can't start ride?**

- Verify status is "accepted"
- Check you're the assigned driver
- Ensure internet connection
- Try refreshing

**Can't complete ride?**

- Verify status is "in_progress"
- Check internet connection
- Wait a few seconds and retry
- Contact support if persists

**💡 Demo:** Show troubleshooting steps

---

### Module 11: Support & Resources (5 minutes)

#### Getting Help

**Technical Issues:**

- Email: driver-support@ecab.com
- Phone: +251-XXX-XXXX
- In-app: Support chat
- Available: 24/7

**Company-Specific Issues:**

- Contact: Company admin via app
- Reference: Always include Ride ID
- Response: Usually within 1 hour

**Emergencies:**

- Call: Emergency services (911)
- Notify: ECAB support immediately
- Document: All incidents
- Follow: Company emergency protocols

#### Documentation Resources

- **Complete Guide:** `DRIVER_COMPANY_RIDES_GUIDE.md`
- **Quick Reference:** `DRIVER_COMPANY_RIDES_QUICK_REFERENCE.md`
- **Workflow Diagrams:** `DRIVER_COMPANY_RIDES_WORKFLOW.md`
- **In-App Help:** Help section in driver app

#### Training Materials

- This presentation
- Video tutorials (if available)
- Practice scenarios
- FAQ document

**💡 Demo:** Show support features in app

---

### Module 12: Best Practices Summary (10 minutes)

#### Before Accepting

- ✅ Check scheduled time
- ✅ Verify you can make it
- ✅ Check vehicle condition
- ✅ Review route and traffic
- ✅ Ensure enough fuel

#### After Accepting

- ✅ Navigate immediately
- ✅ Contact employee if needed
- ✅ Arrive early (scheduled rides)
- ✅ Find exact pickup location
- ✅ Park safely

#### During Ride

- ✅ Verify employee identity
- ✅ Professional greeting
- ✅ Confirm destination
- ✅ Drive safely
- ✅ Follow efficient route
- ✅ Maintain clean vehicle
- ✅ Professional conduct
- ✅ Respect privacy

#### After Completing

- ✅ Ensure employee exits safely
- ✅ Confirm completion in app
- ✅ Clean vehicle if needed
- ✅ Ready for next ride
- ✅ Review any feedback

#### Daily Routine

- ✅ Check vehicle before starting
- ✅ Review scheduled rides
- ✅ Plan your day
- ✅ Keep phone charged
- ✅ Maintain professional appearance
- ✅ Monitor performance metrics
- ✅ Respond to feedback

---

## 📝 Training Assessment

### Knowledge Check Questions

1. What is the main difference between company rides and regular rides?
2. What do you need to accept company rides?
3. What are the 6 steps in the company ride lifecycle?
4. When should you arrive for a scheduled ride?
5. What should you do if an employee is not at the pickup location?
6. Can you request payment from an employee? Why or why not?
7. What are the 6 key performance metrics?
8. What is a good cancellation rate?
9. What should you do if your vehicle breaks down during a ride?
10. Where can you view your company ride earnings?

### Practical Assessment

**Scenario-Based Evaluation:**

1. Accept a company ride in the app
2. Navigate to pickup location
3. Start the ride
4. Complete the ride
5. Handle a no-show scenario
6. Cancel a ride properly
7. View performance metrics
8. Contact support

---

## 🎓 Certification

Upon successful completion:

- ✅ Pass knowledge assessment (80% minimum)
- ✅ Complete practical assessment
- ✅ Demonstrate professional conduct
- ✅ Understand all safety protocols

**You will receive:**

- Company Rides Driver Certification
- Access to company ride assignments
- Eligibility for company contracts
- Performance dashboard access

---

## 📚 Post-Training Resources

### Ongoing Support

- Weekly driver meetings
- Performance reviews
- Refresher training (quarterly)
- Advanced training opportunities

### Continuous Improvement

- Review your metrics weekly
- Read employee feedback
- Learn from experiences
- Share best practices
- Stay updated on policies

### Career Growth

- Build strong company relationships
- Earn performance bonuses
- Get more contracts
- Become a trainer
- Leadership opportunities

---

## 🎯 Training Completion Checklist

- [ ] Attended all training modules
- [ ] Reviewed all documentation
- [ ] Practiced in the app
- [ ] Passed knowledge assessment
- [ ] Completed practical assessment
- [ ] Received certification
- [ ] Have support contact information
- [ ] Know where to find resources
- [ ] Understand professional expectations
- [ ] Ready to provide excellent service!

---

## 📞 Questions?

**Contact Training Team:**

- Email: driver-training@ecab.com
- Phone: +251-XXX-XXXX
- Office Hours: Mon-Fri, 9 AM - 5 PM

---

**Welcome to ECAB Company Rides!**
**Drive safely, professionally, and successfully! 🚗✨**
