<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Dates are inclusive: 12 Oct to 14 Oct is 3 days.
     * Only "pending" and "confirmed" bookings block a car.
     */
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_ref', 20)->unique();          // e.g. RNG-20261012-0001
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('vehicle_id')->constrained()->restrictOnDelete();
            $table->date('pickup_date');
            $table->date('return_date');
            $table->string('pickup_location', 100)->default('RentNGo HQ, Shah Alam');
            $table->unsignedInteger('total_days');
            $table->decimal('price_per_day', 8, 2);              // price at time of booking
            $table->decimal('total_amount', 10, 2);
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'completed'])->default('pending');
            $table->string('notes')->nullable();
            $table->timestamps();

            // Speeds up the availability (double-booking) check
            $table->index(['vehicle_id', 'status', 'pickup_date', 'return_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
