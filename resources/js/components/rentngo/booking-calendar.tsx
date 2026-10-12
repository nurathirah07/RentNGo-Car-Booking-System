import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import type { DateRange, Matcher } from 'react-day-picker';
import { parseISODate, toISODate } from '@/lib/format';

type BookedRange = { from: string; to: string };

type BookingCalendarProps = {
    /** Selected pickup / return dates as "YYYY-MM-DD" ('' = not picked yet). */
    pickupDate: string;
    returnDate: string;
    onChange: (pickupDate: string, returnDate: string) => void;
    /** Today's date from the server, so the customer's clock can't unlock past days. */
    today: string;
    /** Days this car is already booked (greyed out and crossed through). */
    bookedDates: BookedRange[];
    maxDays: number;
};

/**
 * Month calendar for picking the rental period, built on react-day-picker.
 *
 * - First tap = pickup day (also a 1-day rental), second tap = return day.
 * - Past days and already-booked days can't be picked, and a range that would
 *   run across a booked day starts over (`excludeDisabled`).
 * - Changing month slides the weeks in (`animate`, styled in app.css).
 */
export default function BookingCalendar({
    pickupDate,
    returnDate,
    onChange,
    today,
    bookedDates,
    maxDays,
}: BookingCalendarProps) {
    const todayDate = parseISODate(today);
    const booked: Matcher[] = bookedDates.map((range) => ({
        from: parseISODate(range.from),
        to: parseISODate(range.to),
    }));

    const selected: DateRange | undefined = pickupDate
        ? {
              from: parseISODate(pickupDate),
              to: returnDate ? parseISODate(returnDate) : undefined,
          }
        : undefined;

    // While only the pickup day is chosen, days past the longest allowed rental are off.
    const tooLong: Matcher[] =
        pickupDate && pickupDate === returnDate
            ? [
                  {
                      after: new Date(
                          parseISODate(pickupDate).getTime() +
                              (maxDays - 1) * 86_400_000,
                      ),
                  },
              ]
            : [];

    function handleSelect(range: DateRange | undefined) {
        if (!range?.from) {
            onChange('', '');

            return;
        }

        const from = toISODate(range.from);
        // No return day yet: treat it as a one-day rental until a second day is tapped.
        const to = range.to ? toISODate(range.to) : from;

        onChange(from, to);
    }

    return (
        <DayPicker
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected?.from ?? todayDate}
            startMonth={todayDate}
            disabled={[{ before: todayDate }, ...booked, ...tooLong]}
            excludeDisabled
            modifiers={{ booked }}
            modifiersClassNames={{
                booked: '[&>button]:line-through [&>button]:decoration-danger/60',
            }}
            weekStartsOn={1}
            showOutsideDays={false}
            navLayout="around"
            animate
            className="w-full"
            classNames={{
                months: 'relative w-full overflow-hidden',
                month: 'relative grid w-full grid-cols-[2.25rem_1fr_2.25rem] items-center gap-y-3',
                month_caption:
                    'col-start-2 flex h-9 items-center justify-center',
                caption_label: 'text-sm font-bold',
                button_previous:
                    'col-start-1 row-start-1 flex size-9 items-center justify-center rounded-full bg-muted text-foreground transition-colors duration-150 hover:bg-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35',
                button_next:
                    'col-start-3 row-start-1 flex size-9 items-center justify-center rounded-full bg-muted text-foreground transition-colors duration-150 hover:bg-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35',
                month_grid: 'col-span-3 w-full border-collapse',
                weekdays: 'flex',
                weekday:
                    'flex-1 pb-1 text-center text-xs font-medium text-muted-foreground',
                week: 'mt-1 flex w-full',
                day: 'flex-1 p-0 text-center',
                day_button:
                    'mx-auto flex aspect-square w-full max-w-10 items-center justify-center rounded-lg text-sm font-medium transition-[background-color,color,transform] duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-95 disabled:cursor-not-allowed disabled:hover:bg-transparent',
                today: '[&>button]:font-extrabold [&>button]:text-brand',
                // Selected range: dark pills at both ends, a pale-blue band in between.
                range_start:
                    'rounded-l-lg bg-primary [&>button]:bg-foreground [&>button]:text-background [&>button]:hover:bg-foreground',
                range_end:
                    'rounded-r-lg bg-primary [&>button]:bg-foreground [&>button]:text-background [&>button]:hover:bg-foreground',
                range_middle:
                    'bg-primary [&>button]:rounded-none [&>button]:text-primary-foreground [&>button]:hover:bg-primary-hover',
                disabled: '[&>button]:text-muted-foreground/40',
                hidden: 'invisible',
                // Month change animation (classes defined in app.css)
                weeks_before_enter: 'cal-weeks-before-enter',
                weeks_before_exit: 'cal-weeks-before-exit',
                weeks_after_enter: 'cal-weeks-after-enter',
                weeks_after_exit: 'cal-weeks-after-exit',
                caption_after_enter: 'cal-caption-enter',
                caption_after_exit: 'cal-caption-exit',
                caption_before_enter: 'cal-caption-enter',
                caption_before_exit: 'cal-caption-exit',
            }}
            components={{
                Chevron: ({ orientation }) =>
                    orientation === 'left' ? (
                        <ChevronLeft className="size-4" />
                    ) : (
                        <ChevronRight className="size-4" />
                    ),
            }}
        />
    );
}
