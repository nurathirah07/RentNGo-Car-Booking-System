/** One row of the bell menu (shared by HandleInertiaRequests). */
export type NotificationItem = {
    id: string;
    title: string;
    message: string;
    read: boolean;
    /** e.g. "5 minutes ago" */
    time: string | null;
};

export type SharedNotifications = {
    unread: number;
    items: NotificationItem[];
};
