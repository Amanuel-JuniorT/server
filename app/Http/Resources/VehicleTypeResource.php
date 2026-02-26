<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleTypeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'display_name' => $this->display_name,
            'description' => $this->description,
            'base_fare' => (float) $this->base_fare,
            'price_per_km' => (float) $this->price_per_km,
            'price_per_minute' => (float) $this->price_per_minute,
            'minimum_fare' => (float) $this->minimum_fare,
            // Exclude commission and transaction percentages for passengers
        ];
    }
}
