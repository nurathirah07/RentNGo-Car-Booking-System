<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Category;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * The data from the original rentngo_db (phpMyAdmin dump, 11 Oct 2026),
 * converted to the Laravel schema:
 *   - the old `admins` and `customers` tables are merged into `users`, told apart by `role`
 *     (both old admin roles, superadmin and staff, become role "admin")
 *   - category_name -> name, customer_id -> user_id, *_id primary keys -> id
 *   - images are stored as "vehicles/<file>" on the public disk
 *
 * Logins (same passwords as the old system):
 *   Admins     admin@rentngo.my, huda@rentngo.my       / admin123
 *   Customers  aisyah@example.com (and the other 3)    / customer123
 */
class RentNGoSeeder extends Seeder
{
    public function run(): void
    {
        // ---------- Users (from the old `admins` + `customers` tables) ----------
        // forceCreate is used because "role" is intentionally not mass-assignable.
        // The "hashed" cast on User hashes the plain passwords automatically.
        foreach ([['System Administrator', 'admin@rentngo.my'], ['Nurul Huda', 'huda@rentngo.my']] as [$name, $email]) {
            User::forceCreate([
                'name' => $name,
                'email' => $email,
                'password' => 'admin123',
                'role' => 'admin',
                'email_verified_at' => now(),
            ]);
        }

        // Keyed by the old customer_id, so the bookings below can keep using those numbers.
        $customers = collect([
            1 => ['Aisyah Rahman', 'aisyah@example.com', '012-3456789', '990101-10-1234', 'D12345678', '2029-01-01', 'No. 12, Jalan Melati 3, 40150 Shah Alam, Selangor'],
            2 => ['Daniel Lim', 'daniel@example.com', '016-2233445', '980512-14-5678', 'D23456789', '2028-05-12', '25, Jalan SS2/24, 47300 Petaling Jaya, Selangor'],
            3 => ['Kavitha Subramaniam', 'kavitha@example.com', '019-8877665', '970823-08-4321', 'D34567890', '2027-08-23', '8, Lorong Bunga Raya, 30450 Ipoh, Perak'],
            4 => ['Hafiz Ismail', 'hafiz@example.com', '013-5566778', '010304-03-8765', 'D45678901', '2030-03-04', 'Lot 45, Kampung Pulau Melaka, 15200 Kota Bharu, Kelantan'],
        ])->map(fn ($c) => User::forceCreate([
            'name' => $c[0],
            'email' => $c[1],
            'password' => 'customer123',
            'role' => 'customer',
            'phone' => $c[2],
            'ic_number' => $c[3],
            'license_number' => $c[4],
            'license_expiry' => $c[5],
            'address' => $c[6],
            'email_verified_at' => now(),
        ]));

        // ---------- Categories ----------
        $cat = collect([
            'Compact' => 'Small, fuel-efficient cars for city driving',
            'Sedan' => 'Comfortable cars for families and long trips',
            'SUV' => 'Spacious vehicles with higher ground clearance',
            'MPV' => 'Multi-purpose vehicles for 7 or more passengers',
            'Luxury' => 'Premium vehicles for special occasions',
        ])->map(fn ($desc, $name) => Category::create(['name' => $name, 'description' => $desc]));

        // ---------- Vehicles ----------
        // [category, brand, model, year, plate, color, transmission, fuel, seats, price/day, status, photo (transparent side-view PNG), description]
        $v = collect([
            ['Compact', 'Perodua', 'Axia', 2023, 'WXA 1234', 'Silver', 'Auto', 'Petrol', 5, 90, 'available', 'axia.png', 'Economical city car with great fuel efficiency.'],
            ['Compact', 'Perodua', 'Myvi', 2024, 'BMY 5678', 'Red', 'Auto', 'Petrol', 5, 120, 'available', 'myvi.png', "Malaysia's favourite hatchback, roomy and easy to park."],
            ['Sedan', 'Proton', 'Saga', 2023, 'VBS 2468', 'White', 'Auto', 'Petrol', 5, 100, 'available', 'saga.png', 'Affordable sedan with a large boot.'],
            ['Sedan', 'Honda', 'City', 2024, 'WHC 1357', 'Grey', 'Auto', 'Petrol', 5, 180, 'available', 'city.png', 'Comfortable sedan with modern safety features.'],
            ['SUV', 'Proton', 'X50', 2024, 'BPX 8080', 'Blue', 'Auto', 'Petrol', 5, 230, 'available', 'x50.png', 'Turbocharged compact SUV.'],
            ['SUV', 'Perodua', 'Ativa', 2023, 'WAT 3321', 'Black', 'Auto', 'Petrol', 5, 160, 'maintenance', 'ativa.png', 'Compact SUV with good fuel economy.'],
            ['MPV', 'Perodua', 'Alza', 2024, 'VAL 7788', 'Silver', 'Auto', 'Petrol', 7, 200, 'available', 'alza.png', '7-seater MPV ideal for family trips.'],
            ['MPV', 'Toyota', 'Innova', 2022, 'BTI 4455', 'White', 'Auto', 'Diesel', 8, 280, 'available', 'innova.png', 'Spacious 8-seater for group travel.'],
            ['Luxury', 'BMW', '330e', 2023, 'WBM 3300', 'Black', 'Auto', 'Hybrid', 5, 550, 'available', 'bmw330e.png', 'Plug-in hybrid luxury sedan.'],
            ['Luxury', 'Toyota', 'Vellfire', 2022, 'VVF 9999', 'Pearl White', 'Auto', 'Petrol', 7, 750, 'available', 'vellfire.png', 'Premium MPV for weddings and VIP transport.'],
        ])->mapWithKeys(fn ($r) => [$r[2] => Vehicle::create([
            'category_id' => $cat[$r[0]]->id,
            'brand' => $r[1],
            'model' => $r[2],
            'year' => $r[3],
            'plate_number' => $r[4],
            'color' => $r[5],
            'transmission' => $r[6],
            'fuel_type' => $r[7],
            'seats' => $r[8],
            'price_per_day' => $r[9],
            'status' => $r[10],
            'image' => $this->imagePath($r[11]),
            'description' => $r[12],
        ])]);

        // ---------- Bookings + payments ----------
        // [ref, old customer_id, vehicle model, pickup, return, location, status, notes,
        //  payment method, payment status, transaction ref, paid at]
        $bookings = [
            ['RNG-20260915-0001', 1, 'Myvi', '2026-09-15', '2026-09-17', 'RentNGo HQ, Shah Alam', 'completed', null, 'Online Banking', 'paid', 'FPX20260915001', '2026-09-14 20:15:00'],
            ['RNG-20260920-0002', 2, 'City', '2026-09-20', '2026-09-21', 'KLIA Terminal 1', 'completed', 'Flight arrival 9am', 'Credit/Debit Card', 'paid', 'CC20260919002', '2026-09-19 10:02:00'],
            ['RNG-20261001-0003', 3, 'Alza', '2026-10-01', '2026-10-03', 'RentNGo HQ, Shah Alam', 'cancelled', 'Customer changed plans', 'E-Wallet', 'refunded', 'TNG20260928003', '2026-09-28 14:40:00'],
            ['RNG-20261012-0004', 1, 'X50', '2026-10-12', '2026-10-15', 'RentNGo HQ, Shah Alam', 'confirmed', null, 'Online Banking', 'paid', 'FPX20261008004', '2026-10-08 09:30:00'],
            ['RNG-20261014-0005', 4, 'Myvi', '2026-10-14', '2026-10-16', 'KL Sentral', 'confirmed', null, 'Cash', 'pending', null, null],
            ['RNG-20261020-0006', 2, '330e', '2026-10-20', '2026-10-21', 'RentNGo HQ, Shah Alam', 'pending', 'Anniversary dinner', 'Credit/Debit Card', 'pending', null, null],
            ['RNG-20261025-0007', 3, 'Vellfire', '2026-10-25', '2026-10-26', 'RentNGo HQ, Shah Alam', 'pending', 'Wedding transport', 'Online Banking', 'pending', null, null],
        ];

        foreach ($bookings as [$ref, $customerId, $model, $pickup, $return, $location, $status, $notes, $method, $payStatus, $transactionRef, $paidAt]) {
            $vehicle = $v[$model];
            $days = Booking::countDays($pickup, $return);

            $booking = Booking::create([
                'booking_ref' => $ref,
                'user_id' => $customers[$customerId]->id,
                'vehicle_id' => $vehicle->id,
                'pickup_date' => $pickup,
                'return_date' => $return,
                'pickup_location' => $location,
                'total_days' => $days,
                'price_per_day' => $vehicle->price_per_day,
                'total_amount' => $days * $vehicle->price_per_day,
                'status' => $status,
                'notes' => $notes,
            ]);

            Payment::create([
                'booking_id' => $booking->id,
                'amount' => $booking->total_amount,
                'method' => $method,
                'status' => $payStatus,
                'transaction_ref' => $transactionRef,
                'paid_at' => $paidAt,
            ]);
        }
    }

    /**
     * The old system stored only a file name (e.g. "axia.jpg"). Link it only when
     * the photo has been copied to storage/app/public/vehicles, so the admin table
     * shows the placeholder icon instead of a broken image.
     */
    private function imagePath(string $file): ?string
    {
        $path = "vehicles/{$file}";

        return Storage::disk('public')->exists($path) ? $path : null;
    }
}
