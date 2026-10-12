<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Ported from the original rentngo_db design: database triggers that refuse
 * a booking whose dates are invalid or that overlap another active booking
 * for the same car. The app already checks this (Vehicle::isAvailableBetween),
 * so the triggers are a second safety net, e.g. against two customers
 * clicking "Book" at the same moment.
 *
 * MySQL/MariaDB only: the test suite runs on SQLite, where this migration does nothing.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

        DB::unprepared($this->triggerSql('trg_bookings_no_overlap_insert', 'INSERT', ''));
        DB::unprepared($this->triggerSql('trg_bookings_no_overlap_update', 'UPDATE', 'AND b.id <> NEW.id'));
    }

    public function down(): void
    {
        if (! in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

        DB::unprepared('DROP TRIGGER IF EXISTS trg_bookings_no_overlap_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS trg_bookings_no_overlap_update');
    }

    /**
     * Two date ranges overlap when: new pickup <= existing return AND new return >= existing pickup.
     * Only pending/confirmed bookings block a car; cancelled and completed ones do not.
     */
    private function triggerSql(string $name, string $event, string $skipSelf): string
    {
        return <<<SQL
            CREATE TRIGGER {$name} BEFORE {$event} ON bookings FOR EACH ROW
            BEGIN
                IF NEW.return_date < NEW.pickup_date THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Return date cannot be earlier than pickup date.';
                END IF;

                IF NEW.status IN ('pending', 'confirmed') AND EXISTS (
                    SELECT 1 FROM bookings b
                    WHERE b.vehicle_id = NEW.vehicle_id
                      {$skipSelf}
                      AND b.status IN ('pending', 'confirmed')
                      AND NEW.pickup_date <= b.return_date
                      AND NEW.return_date >= b.pickup_date
                ) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This vehicle is already booked for the selected dates.';
                END IF;
            END
            SQL;
    }
};
