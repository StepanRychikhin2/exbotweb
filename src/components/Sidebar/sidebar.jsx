import { useApp } from '../../context/AppContext';
import { navs } from '../../config/navigation';
import Icon from '../Icon/icon';
import Brand from '../Brand/brand';
import Appearance from '../Appearance/appearance';
import { bindStyles } from '../../styles/bindStyles';
import styles from './sidebar.module.css';

function Sidebar() {
	const { t, route, go } = useApp()
	return (
		<aside className={bindStyles(styles, "sidebar")}>
			<button className={bindStyles(styles, "brand-link")} onClick={() => go('landing')}>
				<Brand />
			</button>
			<div className={bindStyles(styles, "sidebar-label")}>{t('demo')}</div>
			<nav aria-label={t('more')}>
				{[
					...navs.filter(([r]) => r !== 'more'),
					['budget', 'wallet'],
					['reports', 'chart'],
					['reminders', 'bell'],
				].map(([r, i]) => (
					<button
						key={r}
						className={bindStyles(styles, `${route.split('/')[0] === r ? 'active' : ''} ${r === 'add' ? 'sidebar-add' : ''}`)}
						onClick={() => go(r)}
						aria-current={route.split('/')[0] === r ? 'page' : undefined}
					>
						<Icon name={i} />
						<span>{t(r)}</span>
						{r === 'add' && <span className={bindStyles(styles, "key-hint")}>＋</span>}
					</button>
				))}
			</nav>
			<div className={bindStyles(styles, "sidebar-bottom")}>
				<div className={bindStyles(styles, "sidebar-quote")}>
					<Icon name="coffee" />
					<p>{t('heroFine')}</p>
				</div>
				<button
					className={bindStyles(styles, route === 'settings' ? 'active' : '')}
					onClick={() => go('settings')}
				>
					<Icon name="settings" />
					<span>{t('settings')}</span>
				</button>
				<Appearance />
			</div>
		</aside>
	)
}

export default Sidebar;
