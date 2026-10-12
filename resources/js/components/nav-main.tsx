import { Link } from '@inertiajs/react';
import { ActivePill } from '@/components/rentngo/motion';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items }: { items: NavItem[] }) {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider uppercase">
                Menu
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1">
                {items.map((item) => {
                    const isActive = item.exact
                        ? isCurrentUrl(item.href)
                        : isCurrentOrParentUrl(item.href);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                                // The highlight is drawn by ActivePill so it can slide between items.
                                className="relative isolate overflow-visible data-[active=true]:bg-transparent"
                            >
                                <Link href={item.href} prefetch>
                                    {isActive && (
                                        <ActivePill
                                            layoutId="sidebar-active"
                                            className="rounded-lg bg-sidebar-accent"
                                        />
                                    )}
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
