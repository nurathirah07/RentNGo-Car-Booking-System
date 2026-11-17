import { BadgePercent, ShieldCheck } from 'lucide-react';
import AnimatedNumber from '@/components/rentngo/animated-number';
import { ringgit } from '@/lib/format';
import { cn } from '@/lib/utils';

type PriceBreakdownProps = {
    pricePerDay: number;
    days: number;
    subtotal: number;
    discount: number;
    total: number;
    deposit: number;
    /** Late-return fee recorded when the car came back (completed bookings only). */
    lateFee?: number;
    /** Count the numbers up/down when they change (the live booking card). */
    animated?: boolean;
    className?: string;
};

/**
 * The price lines shown before and after booking: days × daily price,
 * the 10% weekly discount, the total, and the refundable deposit (paid at pickup).
 */
export default function PriceBreakdown({
    pricePerDay,
    days,
    subtotal,
    discount,
    total,
    deposit,
    lateFee = 0,
    animated = false,
    className,
}: PriceBreakdownProps) {
    const money = (value: number) =>
        animated ? (
            <AnimatedNumber value={value} format={ringgit} />
        ) : (
            ringgit(value)
        );

    return (
        <dl
            className={cn(
                'space-y-2 rounded-xl bg-muted/60 p-4 text-sm',
                className,
            )}
        >
            <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">
                    {ringgit(pricePerDay)} × {days} day{days === 1 ? '' : 's'}
                </dt>
                <dd>{money(subtotal)}</dd>
            </div>
            {discount > 0 && (
                <div className="flex justify-between gap-3 text-success">
                    <dt className="flex items-center gap-1.5">
                        <BadgePercent className="size-4" />
                        Weekly discount (10%)
                    </dt>
                    <dd>−{money(discount)}</dd>
                </div>
            )}
            <div className="flex justify-between gap-3 border-t border-dashed pt-2 text-base font-bold">
                <dt>Total</dt>
                <dd>{money(total)}</dd>
            </div>
            {lateFee > 0 && (
                <div className="flex justify-between gap-3 text-danger">
                    <dt>Late return fee</dt>
                    <dd>{ringgit(lateFee)}</dd>
                </div>
            )}
            {deposit > 0 && (
                <div className="flex items-start justify-between gap-3 pt-1 text-xs text-muted-foreground">
                    <dt className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 shrink-0 text-brand" />
                        Refundable deposit, paid at pickup
                    </dt>
                    <dd className="font-semibold text-foreground">
                        {ringgit(deposit)}
                    </dd>
                </div>
            )}
        </dl>
    );
}
