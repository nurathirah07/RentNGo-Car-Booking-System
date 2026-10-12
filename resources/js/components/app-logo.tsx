import Logo from '@/components/rentngo/logo';

/** Logo in the admin sidebar header (collapses to just the badge). */
export default function AppLogo() {
    return (
        <Logo className="[&>span:last-child]:group-data-[collapsible=icon]:hidden" />
    );
}
