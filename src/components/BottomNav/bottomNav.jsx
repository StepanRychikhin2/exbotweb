import { useApp } from '../../context/AppContext';
import { navs } from '../../config/navigation';
import Icon from '../Icon/icon';
import { bindStyles } from '../../styles/bindStyles';
import styles from './bottomNav.module.css';

function BottomNav() {
	const { t, route, go } = useApp()
	const current = route.split('/')[0]
	return (
		<nav className={bindStyles(styles, "bottom-nav")} aria-label={t('more')}>
			{navs.map(([r, i]) => (
				<button
					key={r}
					className={bindStyles(styles, `${r === 'add' ? 'nav-add' : ''} ${current === r ? 'active' : ''}`)}
					onClick={() => go(r)}
					aria-label={t(r)}
					aria-current={current === r ? 'page' : undefined}
				>
					<span>
						<Icon name={i} />
					</span>
					{r !== 'add' && <small>{t(r)}</small>}
				</button>
			))}
		</nav>
	)
}

export default BottomNav;
