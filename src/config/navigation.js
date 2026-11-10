export const navs = [
	['overview', 'home'],
	['expenses', 'list'],
	['add', 'plus'],
	['categories', 'grid'],
	['more', 'more'],
]

export function getActiveTab(page) {
	if (page === 'category') return 'categories'
	if (['budget', 'reports', 'settings', 'reminders'].includes(page)) return 'more'
	return navs.some(([tab]) => tab === page) ? page : 'add'
}
