<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Pricing rules for a booking:
 *  - subtotal_amount: days x price per day, before any discount
 *  - discount_amount: the weekly discount (7+ days)
 *  - total_amount (existing column): what the customer pays for the rental
 *  - deposit_amount: refundable deposit paid at pickup
 *  - late_days / late_fee: recorded by an admin when the car comes back late
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->decimal('subtotal_amount', 10, 2)->default(0)->after('price_per_day');
            $table->decimal('discount_amount', 10, 2)->default(0)->after('subtotal_amount');
            $table->decimal('deposit_amount', 10, 2)->default(0)->after('total_amount');
            $table->unsignedSmallInteger('late_days')->default(0)->after('deposit_amount');
            $table->decimal('late_fee', 10, 2)->default(0)->after('late_days');
        });

        // Older bookings had no discount, so their subtotal equals their total.
        DB::table('bookings')->update(['subtotal_amount' => DB::raw('total_amount')]);
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['subtotal_amount', 'discount_amount', 'deposit_amount', 'late_days', 'late_fee']);
        });
    }
};
