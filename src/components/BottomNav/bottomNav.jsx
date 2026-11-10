import { useApp } from '../../context/AppContext'
import { navs } from '../../config/navigation'
import Icon from '../Icon/icon'
import styles from './bottomNav.module.css'

function BottomNav({ activeTab, swipeHandlers }) {
	const { data, t, route, go } = useApp()
	const index = navs.findIndex(([tab]) => tab === activeTab)

	return (
		<nav
			className={styles.bar}
			aria-label={data.lang === 'uk' ? 'Головна навігація' : 'Main navigation'}
			style={{ '--tab-count': navs.length, '--active-tab': index }}
			{...swipeHandlers}
		>
			{index >= 0 && <span className={styles.indicator} aria-hidden="true" />}
			{navs.map(([tab, icon]) => (
				<button
					key={tab}
					type="button"
					className={styles.tab}
					onClick={() => go(tab)}
					aria-current={activeTab === tab ? (route === tab ? 'page' : 'location') : undefined}
				>
					<span className={tab === 'add' ? styles.addIcon : styles.icon}>
						<Icon name={icon} size={tab === 'add' ? 19 : 21} />
					</span>
					<small>{t(tab)}</small>
				</button>
			))}
		</nav>
	)
}

export default BottomNav
