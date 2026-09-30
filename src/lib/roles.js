export const dashboardFor = (user) => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'reseller') return '/reseller/dashboard';
    if (user?.isUser === 0) return '/admin/list';
    return '/forms';
};

export const canAccessStaffPanel = (user) =>
    user?.role === 'admin' || (user?.role === 'user' && user?.isUser === 0);
