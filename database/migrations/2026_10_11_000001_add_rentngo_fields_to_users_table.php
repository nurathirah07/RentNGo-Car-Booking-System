<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds RentNGo fields to the starter kit's users table.
     * Admins and customers share this table and are told apart by "role".
     * Profile fields are nullable because the register form only asks for
     * name, email and password; customers fill these in before booking.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'customer'])->default('customer')->after('email');
            $table->string('phone', 20)->nullable()->after('role');
            $table->string('ic_number', 20)->nullable()->unique()->after('phone');
            $table->string('license_number', 30)->nullable()->after('ic_number');
            $table->date('license_expiry')->nullable()->after('license_number');
            $table->text('address')->nullable()->after('license_expiry');
            $table->enum('status', ['active', 'blocked'])->default('active')->after('address');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['ic_number']);
            $table->dropColumn(['role', 'phone', 'ic_number', 'license_number', 'license_expiry', 'address', 'status']);
        });
    }
};
