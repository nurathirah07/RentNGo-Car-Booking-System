<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->string('brand', 50);
            $table->string('model', 50);
            $table->unsignedSmallInteger('year');
            $table->string('plate_number', 15)->unique();
            $table->string('color', 30)->nullable();
            $table->enum('transmission', ['Auto', 'Manual'])->default('Auto');
            $table->enum('fuel_type', ['Petrol', 'Diesel', 'Hybrid', 'Electric'])->default('Petrol');
            $table->unsignedTinyInteger('seats')->default(5);
            $table->decimal('price_per_day', 8, 2);
            $table->string('image')->nullable();          // path in storage/app/public/vehicles
            $table->text('description')->nullable();
            $table->enum('status', ['available', 'maintenance', 'inactive'])->default('available');
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
