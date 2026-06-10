# Ride Completion & Wallet Payment Optimization

Refactor the ride completion flow to ensure proper price breakdown display, seamless wallet payment authorization for passengers, and accurate transaction recording for drivers.

## User Review Required

> [!IMPORTANT]
> **Wallet Payment Flow Change**: The passenger app will now automatically transition to the "Authorize Payment" screen if the ride status is `pending_payment` and the payment method is `wallet`. This ensures the passenger doesn't get "stuck" in the ride-in-progress state.

> [!NOTE]
> I will be updating the `type` field for driver transactions from `'payment'` to `'deposit'` (or the repository's standard for earnings) to ensure it appears in the driver's transaction history filters.

## Proposed Changes

### Passenger App

#### [MODIFY] [RideEndedBottomSheet.java](file:///c:/Users/Home/Documents/TAC/Project/ETHIOCAB/ECAB_App/client/Passenger/app/src/main/java/com/vtech/ecabpassengerapp/BottomSheetFragments/RideEndedBottomSheet.java)
- Update `newInstance` to accept additional arguments: `baseFare`, `distanceFare`, `timeFare`, and `bookingFee`.
- Update `setupUI` to populate the existing summary layout fields (`summary_base_fare`, etc.) with these values.
- Ensure that if `paymentMethod` is `"wallet"`, the bottom sheet can optionally start directly on the `ViewFlipper` page 1 (Authorization).

#### [MODIFY] [MainMapFragment.java](file:///c:/Users/Home/Documents/TAC/Project/ETHIOCAB/ECAB_App/client/Passenger/app/src/main/java/com/vtech/ecabpassengerapp/MainFragments/MainMapFragment.java)
- In `handleEndedStatus` and `handleRideEnded`, implement extraction logic for the fare breakdown from the Pusher event/Active ride JSON.
- Pass the extracted breakdown data to the `RideEndedBottomSheet`.
- Ensure transition logic correctly dismisses the `driverAcceptedBottomSheet` when a ride settles into the `pending_payment` state.

---

### Backend (Laravel)

#### [MODIFY] [RideController.php](file:///c:/Users/Home/Documents/TAC/Project/ETHIOCAB/ECAB_App/server/app/Http/Controllers/RideController.php)
- Review and refine the `confirmWalletPayment` method.
- Update the `Transaction::create` call for the driver's earnings to use a type that aligns with the Driver app's transaction history filters (e.g., changing `'payment'` to `'earnings'` or `'deposit'`).
- Ensure the `driver_id` and `user_id` resolution for the wallet credit is robust.

---

### Driver App (Internal Verification)

#### [MODIFY] [TransactionHistory logic/filters]
- I will verify the transaction history logic in the Driver app to ensure it is filtering for the correct type.

## Open Questions

- What is the specific string/constant the Driver app uses in its Transaction History to filter for "Earnings"? (e.g., is it `deposit`, `ride_earnings`, or `payment`?)
- Should the "Authorize Payment" screen be optional (allowing the user to see the summary first) or mandatory before seeing the summary when in `pending_payment` mode?

## Verification Plan

### Automated Tests
- No automated tests available in the current environment.

### Manual Verification
1. **Passenger UI Check**: Complete a ride and verify that the "Ride Summary" now shows Base Fare, Distance Fare, etc.
2. **Wallet Flow Check**: End a ride as a driver with "Wallet" selected. Verify the passenger app immediately prompts for the wallet password/authorization.
3. **Transaction Check**: Authorize the payment on the passenger app, then log in to the driver app and verify the earnings appear in the "Transactions" list.
