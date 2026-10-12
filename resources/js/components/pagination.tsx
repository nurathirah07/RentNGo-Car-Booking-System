import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { Paginated } from '@/types';

/**
 * Page links for any Laravel ->paginate() result.
 * Laravel already builds the links (with the current filters in the URL),
 * so this component only renders them.
 */
export default function Pagination<T>({
    paginator,
}: {
    paginator: Paginated<T>;
}) {
    if (paginator.last_page <= 1) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
                Showing {paginator.from}–{paginator.to} of {paginator.total}
            </p>
            <nav className="flex flex-wrap gap-1" aria-label="Pagination">
                {paginator.links.map((link, index) => {
                    // First and last links are Previous / Next (their labels contain HTML entities).
                    const label =
                        index === 0
                            ? 'Previous'
                            : index === paginator.links.length - 1
                              ? 'Next'
                              : link.label;

                    return link.url ? (
                        <Button
                            key={index}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            asChild
                        >
                            <Link href={link.url} preserveScroll>
                                {label}
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            disabled
                        >
                            {label}
                        </Button>
                    );
                })}
            </nav>
        </div>
    );
}
