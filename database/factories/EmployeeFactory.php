<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'user_id' => User::factory(),
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'employee_id' => $this->faker->unique()->numerify('EMP####'),
            'department' => $this->faker->randomElement(['IT', 'HR', 'Finance', 'Operations', 'Sales']),
            'is_active' => true,
        ];
    }
}
