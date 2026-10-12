/**
 * Section heading inside a card or form (settings sections, rental details...).
 * `default` is a page-level title; `small` is a section title. Uses the type scale.
 */
export default function Heading({
    title,
    description,
    variant = 'default',
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
}) {
    return (
        <header
            className={variant === 'small' ? 'space-y-1' : 'mb-8 space-y-1'}
        >
            <h2 className={variant === 'small' ? 'text-h3' : 'text-h2'}>
                {title}
            </h2>
            {description && (
                <p className="text-body text-muted-foreground">{description}</p>
            )}
        </header>
    );
}
