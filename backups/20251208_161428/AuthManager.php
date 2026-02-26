<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthManager extends Controller
{
    /**
     * Handle user login
     */

    public function login(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:13',
            'password' => 'required|string|min:8',
        ]);

        $user = User::where('phone', $request->phone)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                "status" => "error",
                "message" => "Invalid credentials"
            ], 401);
        }

        $token = $user->createToken('mobile_token')->plainTextToken;

        return response()->json([
            "status" => "success",
            "data" => [
                'token' => $token,
                'user' => $user,
                'is_active' => $user->is_active,
                'approval_state' => optional($user->driver)->approval_state,
            ],
            "message" => "User logged in successfully"
        ], 200);
    }
    /**
     * Handle user registration
     */
   public function register(Request $request)
    {
        try {
            // Validate registration input
            $validate = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'nullable|string|email|max:255|unique:users',
                'phone' => 'required|string|unique:users',
                'role' => 'required|string|in:passenger,driver',
                'is_active' => 'boolean',
                'password' => 'required|string|min:8',
            ]);

            if ($validate->fails()) {
                return response()->json([
                    "status" => "errors",
                    "message" => $validate->errors()->getMessages()
                ], 400);
            }

            // Save new user
            $validated = $validate->validated();

            $user = new User();
            $user->name = $validated['name'];
            $user->phone = $validated['phone'];
            $user->role = $validated['role'];
            $user->is_active = $validated['is_active'] ?? true;
            $user->email = $validated['email'] ?? null;
            $user->password = Hash::make($validated['password']);

            // $user = Auth::user();

            // $user->api_token = $token; // Store the token in the user model
            // $user->profile_image = $request->file('profile_image') ? $request->file('profile_image')->store('profiles') : null;



            if ($user->save()) {
                $token = $user->createToken('mobile_token')->plainTextToken;

                // Dispatch user registered event (broadcast handled by event class)
                // Wrap in try-catch so registration doesn't fail if broadcasting fails
                try {
                    event(new \App\Events\UserRegistered($user));
                } catch (\Exception $broadcastException) {
                    // Log the broadcast error but don't fail registration
                    \Log::warning('Failed to broadcast UserRegistered event: ' . $broadcastException->getMessage());
                }

                return response()->json([
                    "status" => "success",
                    "data" => [
                        'user' => $user,
                        'token' => $token,
                        'is_active' => $user->is_active,
                    ],
                    "message" => "User registered successfully"
                ]);
            }

            return response()->json([
                "status" => "error",
                "message" => "User registration failed"
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                "status" => "error",
                "message" => "An error occurred: " . $e->getMessage()
            ], 500);
        }
    }
public function getDriverApprovalStatus(Request $request)
    {
    $user = $request->user();
    $driver = $user->driver;
    if (!$driver) {
        return response()->json(['approval_state' => 'not_submitted']);
    }
    return response()->json(['driver'=>$driver,'approval_state' => $driver->approval_state]);
    // if ($user->role !== 'driver') {
    //     return response()->json(['approval_state' => 'not_a_driver']);
    // }

        // $driver = $user->driver;
        // if (!$driver) {
        //     return response()->json(['approval_state' => 'not_submitted']);
        // }

        // return response()->json(['approval_state' => $driver->approval_state]);
    }

    public function getUserProfile(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized'
                ], 401);
            }

            // Load driver relationship if exists
            $user->load('driver');

            return response()->json([
                'status' => 'success',
                'data' => [
                    'user' => $user,
                    'is_active' => $user->is_active,
                    'approval_state' => optional($user->driver)->approval_state,
                ],
                'message' => 'Profile retrieved successfully'
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Get profile error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve profile: ' . $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $request->user('sanctum')->tokens()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
