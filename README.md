# RentNGo Car Booking System

Car rental booking system for Malaysia built with **Laravel 13, Inertia.js, React and TypeScript**. Customers browse cars, check live availability on a calendar and book with a pickup time; admins manage vehicles, bookings, payments and customers. Double-booking is blocked with row locks and database triggers.

![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Inertia.js](https://img.shields.io/badge/Inertia.js-3-9553E9)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/tests-Pest-F28D1A)

---

## Screenshots

| Landing page                                  | Browse cars                                      |
| --------------------------------------------- | ------------------------------------------------ |
| ![Landing page](docs/screenshots/landing.png) | ![Browse cars](docs/screenshots/browse-cars.png) |

| Booking with live availability           | Admin dashboard                                          |
| ---------------------------------------- | -------------------------------------------------------- |
| ![Booking](docs/screenshots/booking.png) | ![Admin dashboard](docs/screenshots/admin-dashboard.png) |

---

## Features

### For customers

- **Browse cars** with search, category, transmission, seats and a price-range slider (with a price histogram), plus sorting. All filters live in the URL, so results can be bookmarked or shared.
- **Real-time availability**: pick dates and only the cars that are free for the whole trip are shown.
- **Calendar booking flow**: choose pickup and return days on a calendar (already-booked days are crossed out), pick a pickup time slot, location and payment method, then review a summary before confirming.
- **Live price**: the total (RM × days) updates and animates as the dates change, with a **10% weekly discount** for rentals of 7 days or more and the **refundable deposit** (RM 500 for Luxury cars, RM 200 for others) shown up front.
- **Online payment** with ToyyibPay (FPX online banking and cards, sandbox mode by default). The payment is only recorded after ToyyibPay's API confirms it.
- **My bookings**: upcoming, completed and cancelled trips, with free cancellation until the day before pickup (a paid booking is marked as refunded), a price breakdown and a **PDF receipt** for each booking.
- **Reviews**: rate a car (1–5 stars, with a comment) after a completed trip. Average ratings appear on car cards and reviews on the car page.
- **Saved cars**: the heart on each car saves it to the account (so it follows you to any device), listed on a Saved page.
- **Photo gallery**: each car can have up to 6 extra photos, with thumbnails and a full-screen viewer.
- **Notifications**: a bell with unread updates (booking received, confirmed, cancelled, completed, payment received), also sent by email.
- **Profile with rental details**: phone, IC number (MyKad format) and driving license, which are required before a first booking.

### For admins

- **Dashboard** with fleet, customer, booking and revenue stats, and the latest bookings.
- **Vehicles**: add, edit and delete cars with photo upload. Cars that have bookings cannot be deleted; they are set to _inactive_ instead, so booking history is kept.
- **Bookings**: search and filter, move bookings through _pending → confirmed → completed_ (or cancelled) with only valid status changes allowed, record payments, and download receipts. When completing a late return, the admin enters the days late and a **late fee** of 1.5× the daily price per day is recorded.
- **Customers**: search by name, email, phone or IC, see license validity, and block or unblock accounts.
- **Fleet calendar**: a two-week timeline with one row per car and each booking drawn as a bar.
- **Reports**: monthly revenue chart (last 12 months), most booked cars, fleet utilisation over the last 30 days, and a **CSV export** of every booking.
- **Activity log**: an audit trail of who confirmed, cancelled, paid, edited or blocked what, and when.
- **New booking alerts** in the bell and by email.
- **Automatic tidying** (scheduled every hour): pending bookings not confirmed within 24 hours, or whose pickup day has passed, are cancelled; confirmed bookings whose return day has passed are marked completed.

### Security and data integrity

- **No double bookings**, protected at three levels (see [How double-booking is prevented](#how-double-booking-is-prevented)).
- Role-based access: customers can't open admin pages and admins can't make bookings.
- Blocked users can't log in, and a user blocked while logged in is signed out on their next request.
- Login, availability-check and booking endpoints are rate-limited; all input goes through Form Request validation.
- Customers can only see, cancel, pay for, review and download receipts for their own bookings (a Laravel **policy**; someone else's booking answers 404).
- Booking references are built from the booking's own database id, so two customers booking at the same moment can never get the same reference.
- Online payment callbacks are never trusted on their own: the app asks ToyyibPay's API whether the bill was really paid, and for the right amount.

### Design and user experience

- Light, modern UI built on shadcn/ui with one set of design tokens (colours, type scale, radius, shadows).
- Subtle animations with Framer Motion: page transitions, staggered lists, sliding tab highlights, skeleton loaders while results load, and number counters. All of it respects the operating system's "reduce motion" setting.
- Fully responsive: admin tables turn into cards on phones, the filter panel becomes a slide-in sheet, and a sticky booking bar appears on mobile.
- Accessible: labelled fields, visible focus rings, announced validation errors and a "Skip to content" link.
- Toast notifications for every booking and admin action.

---

## Tech stack

| Layer    | Tools                                                                                     |
| -------- | ----------------------------------------------------------------------------------------- |
| Backend  | Laravel 13, PHP 8.3+, Laravel Fortify (authentication), queued notifications, scheduler   |
| Frontend | React 19, TypeScript, Inertia.js 3, Laravel Wayfinder (typed routes)                      |
| UI       | Tailwind CSS 4, shadcn/ui, lucide-react icons, Framer Motion (`motion`), react-day-picker |
| Database | MySQL / MariaDB (XAMPP); SQLite for the test suite                                        |
| Payments | ToyyibPay (FPX / card), barryvdh/laravel-dompdf (PDF receipts)                            |
| Testing  | Pest, Larastan (PHPStan level 7), GitHub Actions CI                                       |
| Tooling  | Vite, Laravel Pint, oxlint / oxfmt via `vp check`                                         |

---

## How double-booking is prevented

Two customers can try to book the same car for the same dates at the same moment. RentNGo blocks this at three levels:

1. **Live check before booking.** The booking page asks the server (`GET /cars/{vehicle}/availability`) every time the dates change and shows "available" or "already booked" with the price.
2. **Row lock while saving.** `BookingController@store` runs inside a database transaction and locks the car's row with `lockForUpdate()`. A second request for the same car waits for the first to finish, then re-checks availability and is refused.
3. **Database triggers.** On MySQL/MariaDB, `BEFORE INSERT` / `BEFORE UPDATE` triggers on `bookings` reject any pending or confirmed booking whose dates overlap another one, even if something bypasses the application.

Two date ranges overlap when _new pickup ≤ existing return_ and _new return ≥ existing pickup_. Only `pending` and `confirmed` bookings block a car; cancelled and completed ones don't.

---

## Getting started

### Requirements

- PHP 8.3 or newer, with the `pdo_mysql` and `fileinfo` extensions
- Composer
- Node.js 20 or newer and npm
- MySQL or MariaDB (for example through XAMPP)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/nurathirah07/RentNGo-Car-Booking-System.git
cd RentNGo-Car-Booking-System

# 2. Install PHP and JavaScript dependencies
composer install
npm install

# 3. Create the environment file and app key
cp .env.example .env        # on Windows PowerShell: copy .env.example .env
php artisan key:generate
```

### Database

Create an empty database (e.g. `rentngo_db` in phpMyAdmin), then set these values in `.env`:

```env
APP_NAME=RentNGo
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=rentngo_db
DB_USERNAME=root
DB_PASSWORD=
```

Then create the tables, load the sample data and link the public storage folder (needed for car photos):

```bash
php artisan migrate --seed
php artisan storage:link
```

### Run the app

```bash
composer run dev
```

Open **http://localhost:8000**. Use the same address as `APP_URL`, otherwise uploaded photos won't load.

`composer run dev` also starts the **queue worker**, which sends notifications and emails. Emails are written to `storage/logs/laravel.log` by default (`MAIL_MAILER=log`).

To run the hourly booking tidy-up (auto-cancel and auto-complete) while developing, start the scheduler in another terminal:

```bash
php artisan schedule:work
```

On a server, add one cron entry instead: `* * * * * php /path/to/artisan schedule:run`.

### Online payment (optional)

1. Create a free sandbox account at [dev.toyyibpay.com](https://dev.toyyibpay.com) and create a category.
2. Add your keys to `.env`:

    ```env
    TOYYIBPAY_SECRET_KEY=your-secret-key
    TOYYIBPAY_CATEGORY_CODE=your-category-code
    TOYYIBPAY_SANDBOX=true
    ```

3. Run `php artisan config:clear`. A **Pay online** button then appears on unpaid bookings in My bookings.

ToyyibPay must be able to reach your callback URL (`/payments/toyyibpay/callback`), so on your own computer use a tunnel such as `ngrok` and set `APP_URL` to it. Without keys, the button stays hidden and admins record payments by hand.

To reset the database to the sample data at any time:

```bash
php artisan migrate:fresh --seed
```

### Car photos (optional)

Side-view car photos with a transparent background look best. Put them in `storage/app/public/vehicles/` named after the model (`axia.png`, `myvi.png`, `saga.png`, `city.png`, `x50.png`, `ativa.png`, `alza.png`, `innova.png`, `bmw330e.png`, `vellfire.png`) and run `php artisan migrate:fresh --seed`. Without photos, a neutral car silhouette is shown. Admins can also upload photos from the Vehicles page.

---

## Demo accounts

The seeder creates these accounts for local testing:

| Role     | Email                 | Password      |
| -------- | --------------------- | ------------- |
| Admin    | `admin@rentngo.my`    | `admin123`    |
| Admin    | `huda@rentngo.my`     | `admin123`    |
| Customer | `aisyah@example.com`  | `customer123` |
| Customer | `daniel@example.com`  | `customer123` |
| Customer | `kavitha@example.com` | `customer123` |
| Customer | `hafiz@example.com`   | `customer123` |

It also creates 5 categories (Compact, Sedan, SUV, MPV, Luxury), 10 Malaysian cars (Perodua Axia to Toyota Vellfire) and sample bookings with payments.

> These are sample credentials for local development only. Change them before deploying anywhere public.

---

## Running the tests

The test suite uses Pest with an in-memory SQLite database, so it never touches your real data.

```bash
php artisan test --compact
```

It covers authentication and blocked accounts, browsing and filtering, the availability check, booking (including double-booking, pickup-time and profile rules), pricing (weekly discount, deposit, late fees), cancellation, notifications, the scheduled tidy-up, online payments (with ToyyibPay faked), receipts, reviews, saved cars, the photo gallery, reports, and the admin vehicle, booking and customer management.

Code style, static analysis and type checks:

```bash
vendor/bin/pint            # PHP formatting
vendor/bin/phpstan analyse # static analysis (Larastan, level 7)
npm run check              # lint + formatting (oxlint / oxfmt)
npm run types:check        # TypeScript
npm run build              # production build
```

All of these run on every push and pull request through GitHub Actions (`.github/workflows/tests.yml`).

---

## Project structure

```
app/
├── Http/Controllers/
│   ├── Admin/                     # dashboard, vehicles, bookings, customers, reports, fleet calendar, activity log
│   ├── BookingController.php      # customer bookings (create with row lock, cancel)
│   ├── CarController.php          # browse + car detail
│   ├── PaymentController.php      # ToyyibPay checkout, return and callback
│   ├── ReceiptController.php      # PDF receipts
│   └── VehicleAvailabilityController.php  # live availability + price JSON endpoint
├── Actions/Bookings/              # ChangeBookingStatus, RecordPayment (shared by admins, scheduler and gateway)
├── Console/Commands/TidyBookings.php  # hourly auto-cancel / auto-complete
├── Http/Middleware/               # EnsureUserIsAdmin, EnsureUserIsCustomer, EnsureUserIsActive
├── Http/Requests/                 # Form Request validation
├── Models/                        # User, Vehicle, VehicleImage, Category, Booking, Payment, Review, ActivityLog
├── Notifications/                 # booking and payment notifications (database + email, queued)
├── Policies/BookingPolicy.php     # who may cancel, pay, review or download a receipt
└── Services/                      # BookingPricing, ToyyibPay, VehicleSummary

database/
├── migrations/                    # includes the booking overlap triggers
└── seeders/RentNGoSeeder.php      # sample cars, users and bookings

resources/
├── css/app.css                    # design tokens, type scale, utilities
└── js/
    ├── components/rentngo/        # vehicle card, booking calendar, filters, tables, motion helpers...
    ├── layouts/                   # customer top-nav, admin sidebar, auth and settings layouts
    ├── lib/motion.ts              # shared animation settings
    └── pages/                     # Inertia pages (welcome, cars, bookings, admin, auth, settings)

routes/
├── web.php                        # home + dashboard
├── customer.php                   # browse, availability, bookings
└── admin.php                      # admin area
```

---

## Possible improvements

- Two-factor authentication for admin accounts
- WhatsApp notifications alongside email
- Delivery to a custom address and pickup at more locations
- Image optimisation (resizing and WebP conversion) for uploaded photos
- Browser (end-to-end) tests of the booking flow

---

## Author

Built by **[nurathirah07](https://github.com/nurathirah07)** as a portfolio project.
