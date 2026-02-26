<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    // List all users (for testing/debugging)
    public function index()
    {
        return response()->json(User::all());
    }

    // Register a new user with optional profile image
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users,email',
            'phone' => 'required|string|unique:users,phone',
            'password' => 'required|string|min:6',
            'role' => 'required|in:passenger,driver',
            'profile_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $imagePath = null;

        if ($request->hasFile('profile_image')) {
            $imagePath = $request->file('profile_image')->store('profile_images', 'public');
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'],
            'password' => bcrypt($validated['password']),
            'role' => $validated['role'],
            'profile_image' => $imagePath,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'User registered successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'profile_image_url' => $user->profile_image ? asset('storage/' . $user->profile_image) : null,
            ]
        ], 201);
    }

    // View one user
    public function show($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'profile_image_url' => $user->profile_image ? asset('storage/' . $user->profile_image) : null,
        ]);
    }
}
