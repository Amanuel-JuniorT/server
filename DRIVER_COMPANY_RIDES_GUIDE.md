# Driver's Guide to Company Rides

## Overview

This guide explains what drivers should expect and how to handle company rides in the ECAB platform. Company rides are pre-arranged transportation services for employees of registered companies, and they differ from regular passenger rides in several important ways.

---

## What Are Company Rides?

**Company rides** are rides requested by employees of companies that have partnered with ECAB. These rides are:

- **Pre-scheduled** or **immediate** - Some rides are scheduled for a specific date/time, while others are requested immediately
- **Company-paid** - The company covers the cost, not the employee
- **Tracked separately** - Company rides appear in a separate section from regular rides
- **Contract-based** - Only drivers with active contracts with specific companies can accept their rides

---

## How Company Rides Work

### 1. **Driver Contracts**

Before you can accept company rides, you must have an **active contract** with one or more companies. 

**Contract Details:**
- Companies select specific drivers to work with them
- Contracts have start and end dates
- You can have contracts with multiple companies simultaneously
- Only drivers with active contracts can see and accept rides from that company

**To check your contracts:**
- Navigate to the "Company Contracts" section in your driver app
- View all active, pending, and expired contracts
- See which companies you're authorized to serve

### 2. **Receiving Company Ride Requests**

Company rides appear differently from regular rides:

**Scheduled Rides:**
- You'll receive notifications about upcoming scheduled rides
- Rides are broadcast to all drivers with contracts for that company
- You can see the scheduled time, pickup location, and destination in advance
- First driver to accept gets the ride

**Immediate Rides:**
- Similar to regular rides, but only visible to contracted drivers
- Assigned based on proximity and availability
- May have automatic retry assignment if not accepted quickly

**Notification Channels:**
- Listen on the `drivers` channel for new company ride broadcasts
- Event name: `.ride.scheduled`
- Contains full ride details including company name, employee info, and schedule

---

## Company Ride Lifecycle

### Step 1: **Ride Assignment**

When a company ride is created:

1. **Notification Received**: You receive a notification about a new company ride
2. **Ride Details**: Review the pickup address, destination, scheduled time, and employee information
3. **Accept or Decline**: You can choose to accept the ride if you're available

**What you'll see:**
```json
{
  "id": 123,
  "company": {
    "id": 5,
    "name": "Acme Corporation"
  },
  "employee": {
    "id": 42,
    "name": "John Doe",
    "phone": "+251912345678",
    "email": "john@acme.com"
  },
  "pickup_address": "Bole, Addis Ababa",
  "destination_address": "Meskel Square, Addis Ababa",
  "scheduled_time": "2025-11-30T14:00:00Z",
  "status": "requested",
  "price": 150.00
}
```

### Step 2: **Accepting the Ride**

Once you accept a company ride:

1. **Status Changes to "Accepted"**: The ride is now assigned to you
2. **Navigate to Pickup**: Use the app's navigation to reach the pickup location
3. **Contact Employee**: You can call or message the employee if needed
4. **Arrive on Time**: For scheduled rides, arrive a few minutes before the scheduled time

**Important:**
- Once accepted, the ride is your responsibility
- Your driver status changes to "busy"
- You cannot accept other rides until this one is completed or cancelled

### Step 3: **Starting the Ride**

When you arrive at the pickup location and the employee is in your vehicle:

1. **Tap "Start Ride"** in the app
2. **Confirm Employee**: Verify the employee's identity (name matches)
3. **Status Changes to "In Progress"**: The ride timer starts
4. **Navigate to Destination**: Follow the route to the destination address

**API Endpoint Used:**
```
POST /api/driver/company-rides/{id}/start
```

**What happens:**
- Ride status: `accepted` → `in_progress`
- `started_at` timestamp is recorded
- Company admin and employee are notified
- Real-time tracking begins

### Step 4: **During the Ride**

While the ride is in progress:

**Your Responsibilities:**
- ✅ Drive safely and follow traffic rules
- ✅ Follow the most efficient route
- ✅ Maintain professional conduct
- ✅ Keep the vehicle clean and comfortable
- ✅ Respect the employee's privacy and time

**Employee Expectations:**
- Employees expect punctuality, especially for scheduled rides
- Professional and courteous service
- Safe and comfortable journey
- Adherence to company standards

**Special Considerations:**
- Some employees may have regular schedules (daily commutes)
- Building a good relationship can lead to more rides
- Companies track driver ratings and feedback

### Step 5: **Completing the Ride**

When you arrive at the destination:

1. **Confirm Arrival**: Ensure you're at the correct destination
2. **Tap "Complete Ride"** in the app
3. **Status Changes to "Completed"**: The ride is finished
4. **Payment Processed**: The company is billed automatically

**API Endpoint Used:**
```
POST /api/driver/company-rides/{id}/complete
```

**What happens:**
- Ride status: `in_progress` → `completed`
- `completed_at` timestamp is recorded
- Your driver status returns to "available"
- Company admin and employee are notified
- Payment is processed to the company's account

### Step 6: **Post-Ride**

After completing the ride:

- **Rating**: The employee may rate your service
- **Feedback**: Companies review driver performance
- **Payment**: You'll be paid according to your contract terms
- **Next Ride**: You're now available for new rides

---

## Ride Statuses Explained

| Status | Description | What It Means for You |
|--------|-------------|----------------------|
| **requested** | Ride has been created and is awaiting driver assignment | You can accept this ride if you have a contract with the company |
| **accepted** | You have accepted the ride | Navigate to pickup location |
| **in_progress** | Ride has started | Drive to destination |
| **completed** | Ride has been successfully completed | Payment processed, you're available again |
| **cancelled** | Ride was cancelled by driver, employee, or company | No payment, you're available again |
| **expired** | Scheduled ride time has passed without acceptance | Ride is no longer available |

---

## Cancelling a Company Ride

Sometimes you may need to cancel an accepted ride:

**Valid Reasons:**
- Emergency situation
- Vehicle breakdown
- Unable to reach pickup location
- Safety concerns

**How to Cancel:**
1. Tap "Cancel Ride" in the app
2. Provide a reason (optional but recommended)
3. Confirm cancellation

**API Endpoint Used:**
```
POST /api/driver/company-rides/{id}/cancel
```

**Consequences:**
- Your driver status returns to "available"
- The ride is reassigned to another driver
- Frequent cancellations may affect your contract status
- Company may receive notification

**⚠️ Important:**
- Avoid cancelling rides unless absolutely necessary
- Excessive cancellations can damage your reputation
- May result in contract termination

---

## Scheduled Rides vs. Immediate Rides

### Scheduled Rides

**Characteristics:**
- Have a `scheduled_time` field
- May be scheduled hours or days in advance
- Often recurring (daily commutes, weekly trips)
- Require punctuality

**Time Labels:**
- **Today**: Scheduled for today
- **Upcoming**: Scheduled for a future date
- **Past**: Scheduled time has passed but ride is still active
- **Expired**: Scheduled time passed and ride was never accepted (status = expired)

**Best Practices:**
- Accept scheduled rides early if possible
- Plan your route in advance
- Arrive 5-10 minutes before scheduled time
- Notify employee if you'll be late

### Immediate Rides

**Characteristics:**
- No `scheduled_time` (or scheduled for "now")
- Similar to regular passenger rides
- Need quick response
- Assigned based on proximity

**Best Practices:**
- Accept quickly to avoid reassignment
- Navigate immediately to pickup
- Contact employee if you can't find them

---

## Payment and Pricing

### How You Get Paid

**Company Contract Terms:**
- Payment rates are defined in your contract with each company
- May be per-ride, hourly, or monthly
- Different companies may have different rates

**Payment Processing:**
- Company is billed for each completed ride
- Your earnings are calculated based on contract terms
- Payments are processed according to your agreement

**Pricing Display:**
- The `price` field shows the ride cost
- This is what the company pays
- Your earnings may be a percentage or fixed amount

### No Direct Payment from Employee

**Important:**
- Employees do NOT pay you directly
- Do NOT request payment from employees
- All payments are handled through the company billing system
- Asking for payment may result in contract termination

---

## Professional Conduct

### Do's ✅

- **Be Punctual**: Arrive on time, especially for scheduled rides
- **Be Professional**: Dress appropriately and maintain a clean vehicle
- **Be Courteous**: Greet employees politely and respect their space
- **Communicate**: If running late, notify the employee
- **Follow Routes**: Use the most efficient route unless instructed otherwise
- **Maintain Vehicle**: Keep your car clean, fueled, and in good condition
- **Respect Privacy**: Don't ask personal questions or share employee information

### Don'ts ❌

- **Don't Be Late**: Punctuality is critical for company rides
- **Don't Request Tips**: Company rides are fully paid by the company
- **Don't Smoke**: Never smoke in the vehicle
- **Don't Use Phone**: Avoid phone use while driving
- **Don't Deviate**: Don't change routes without good reason
- **Don't Discuss Politics/Religion**: Keep conversations professional
- **Don't Share Information**: Employee details are confidential

---

## Common Scenarios

### Scenario 1: Employee Is Not at Pickup Location

**What to do:**
1. Call the employee using the contact information provided
2. Wait for a reasonable time (5-10 minutes)
3. If no response, contact company admin through the app
4. Document the situation
5. If instructed, cancel the ride with reason "Employee no-show"

### Scenario 2: Employee Wants to Change Destination

**What to do:**
1. Politely explain that destination changes must be made through the app
2. Ask the employee to contact their company admin
3. Wait for confirmation through the app before changing route
4. If urgent, contact company admin yourself
5. Do NOT change destination without approval

### Scenario 3: Employee Wants to Make a Stop

**What to do:**
1. Check if stops are allowed in your contract
2. If allowed, make brief stops as requested
3. Keep the ride timer running
4. Document any extended stops
5. If stops are not allowed, politely explain company policy

### Scenario 4: Scheduled Ride Time Conflicts

**What to do:**
1. Don't accept rides you can't fulfill
2. If you've accepted and can't make it, cancel as early as possible
3. Notify the company admin immediately
4. Provide a valid reason
5. Avoid accepting multiple scheduled rides at overlapping times

### Scenario 5: Vehicle Breakdown During Ride

**What to do:**
1. Ensure employee safety first
2. Contact emergency services if needed
3. Notify the employee and company admin immediately
4. Arrange alternative transportation for the employee
5. Document the incident
6. Cancel the ride with reason "Vehicle breakdown"

---

## API Endpoints Reference

As a driver, your app will use these endpoints:

### Get Your Assigned Company Rides
```
GET /api/driver/company-rides
```
Returns all company rides assigned to you (past and present).

### Get Active Company Ride
```
GET /api/driver/company-rides/active
```
Returns your current active company ride (if any).

### Get Specific Ride Details
```
GET /api/driver/company-rides/{id}
```
Returns details of a specific company ride.

### Start a Ride
```
POST /api/driver/company-rides/{id}/start
```
Marks the ride as in progress. Can only be called when status is "accepted".

### Complete a Ride
```
POST /api/driver/company-rides/{id}/complete
```
Marks the ride as completed. Can only be called when status is "in_progress".

### Cancel a Ride
```
POST /api/driver/company-rides/{id}/cancel
```
Cancels the ride. Can be called when status is "accepted" or "in_progress".

---

## Real-Time Updates

### WebSocket Events

Your driver app listens to real-time events:

**Channel:** `drivers`

**Events:**
- `.ride.scheduled` - New company ride is scheduled
- `.company-ride.driver-assigned` - You've been assigned a ride
- `.ride.status-changed` - Ride status has changed

**Example Event:**
```json
{
  "ride": {
    "id": 123,
    "company": {
      "id": 5,
      "name": "Acme Corporation"
    },
    "employee": {
      "id": 42,
      "name": "John Doe",
      "phone": "+251912345678"
    },
    "pickup_address": "Bole, Addis Ababa",
    "destination_address": "Meskel Square, Addis Ababa",
    "scheduled_time": "2025-11-30T14:00:00Z",
    "status": "requested",
    "price": 150.00
  }
}
```

---

## Performance Metrics

Companies track driver performance:

### Key Metrics

1. **Acceptance Rate**: Percentage of assigned rides you accept
2. **Cancellation Rate**: Percentage of accepted rides you cancel
3. **On-Time Rate**: Percentage of scheduled rides where you arrive on time
4. **Completion Rate**: Percentage of accepted rides you complete
5. **Average Rating**: Employee ratings of your service
6. **Response Time**: How quickly you accept ride requests

### Impact on Your Contract

- **Good Performance**: More ride assignments, contract renewals, bonuses
- **Poor Performance**: Fewer assignments, contract warnings, potential termination

### Tips for Good Performance

- ✅ Accept rides you can fulfill
- ✅ Arrive on time for scheduled rides
- ✅ Complete rides professionally
- ✅ Maintain high ratings
- ✅ Minimize cancellations
- ✅ Respond quickly to requests

---

## Troubleshooting

### Issue: Can't See Company Rides

**Possible Causes:**
- You don't have an active contract with any company
- Your contract has expired
- You're not logged in as a driver
- App is not connected to the server

**Solution:**
1. Check your company contracts in the app
2. Verify your driver status is "available"
3. Ensure app has internet connection
4. Contact support if issue persists

### Issue: Can't Start Ride

**Possible Causes:**
- Ride status is not "accepted"
- You're not the assigned driver
- Network connectivity issue

**Solution:**
1. Verify ride status in the app
2. Check that you're the assigned driver
3. Ensure stable internet connection
4. Try refreshing the app

### Issue: Can't Complete Ride

**Possible Causes:**
- Ride status is not "in_progress"
- Network connectivity issue
- App bug

**Solution:**
1. Verify ride status is "in_progress"
2. Check internet connection
3. Try again in a few seconds
4. Contact support if issue persists

### Issue: Employee Not Responding

**Solution:**
1. Call the employee's phone number
2. Wait at pickup location for 5-10 minutes
3. Send a message through the app
4. Contact company admin
5. Document the no-show
6. Cancel ride if instructed

---

## Support and Contact

### For Technical Issues
- Contact ECAB Driver Support
- Email: driver-support@ecab.com
- Phone: +251-XXX-XXXX
- In-app support chat

### For Company-Specific Issues
- Contact the company admin directly
- Use the in-app messaging system
- Reference the ride ID when reporting issues

### For Emergencies
- Call emergency services (911 or local equivalent)
- Notify ECAB support immediately
- Document the incident
- Follow company emergency protocols

---

## Best Practices Summary

### Before Accepting a Ride
- ✅ Check the scheduled time
- ✅ Verify you can reach the pickup location
- ✅ Ensure you have enough time
- ✅ Check your vehicle condition

### After Accepting a Ride
- ✅ Navigate to pickup immediately
- ✅ Contact employee if needed
- ✅ Arrive on time (or early for scheduled rides)
- ✅ Verify employee identity

### During the Ride
- ✅ Drive safely and professionally
- ✅ Follow the designated route
- ✅ Maintain a clean and comfortable vehicle
- ✅ Respect the employee's privacy

### After Completing a Ride
- ✅ Confirm completion in the app
- ✅ Ensure employee has exited safely
- ✅ Clean vehicle if needed
- ✅ Be ready for the next ride

---

## Frequently Asked Questions

### Q: Can I accept company rides and regular rides at the same time?
**A:** No, you can only have one active ride at a time. Once you accept a company ride, you cannot accept regular rides until it's completed.

### Q: What if I'm running late for a scheduled ride?
**A:** Contact the employee immediately and notify the company admin. Provide an estimated arrival time. Frequent lateness may affect your contract.

### Q: Can I reject a company ride?
**A:** Yes, but frequent rejections may affect your assignment priority and contract status.

### Q: How do I get more company contracts?
**A:** Maintain excellent performance metrics, high ratings, and professional conduct. Companies may offer contracts to top-performing drivers.

### Q: What if the employee is rude or inappropriate?
**A:** Remain professional and calm. Document the incident and report it to ECAB support and the company admin after completing the ride.

### Q: Can I negotiate the price with the employee?
**A:** No, all pricing is predetermined by the company contract. Do not discuss payment with employees.

### Q: What happens if I cancel too many rides?
**A:** Excessive cancellations may result in warnings, reduced ride assignments, or contract termination.

### Q: Can I see my earnings from company rides?
**A:** Yes, check the "Earnings" section in your driver app. Company ride earnings are tracked separately.

---

## Conclusion

Company rides are an excellent opportunity for drivers to earn consistent income with professional clients. By following this guide, maintaining high standards, and providing excellent service, you can build strong relationships with companies and secure long-term contracts.

**Remember:**
- **Punctuality** is critical
- **Professionalism** is expected
- **Communication** is key
- **Safety** is paramount

Welcome to the ECAB company rides program! Drive safely and professionally! 🚗✨
