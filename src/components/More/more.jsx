import { useApp } from '../../context/AppContext';
import Icon from '../Icon/icon';
import PageTitle from '../PageTitle/pageTitle';
import { bindStyles } from '../../styles/bindStyles';
import styles from './more.module.css';

function More() {
	const { t, go } = useApp()
	return (
		<>
			<PageTitle title={t('more')} sub={t('preferences')} />
			<div className={bindStyles(styles, "more-profile")}>
				<span className={bindStyles(styles, "avatar large")}>M</span>
				<div>
					<h2>{t('demoProfile')}</h2>
					<span className={bindStyles(styles, "muted")}>Telegram · {t('demo')}</span>
				</div>
			</div>
			<div className={bindStyles(styles, "menu-list")}>
				{[
					['budget', 'wallet'],
					['reports', 'chart'],
					['reminders', 'bell'],
					['settings', 'settings'],
				].map(([r, i]) => (
					<button onClick={() => go(r)} key={r}>
						<span className={bindStyles(styles, "menu-icon")}>
							<Icon name={i} />
						</span>
						<span>{t(r)}</span>
						<Icon name="chevron" size={18} />
					</button>
				))}
			</div>
			<div className={bindStyles(styles, "plan-card")}>
				<Icon name="coffee" />
				<div>
					<strong>MyEx {t('free')}</strong>
					<p>{t('planSoon')}</p>
				</div>
				<span className={bindStyles(styles, "tag")}>{t('demo')}</span>
			</div>
		</>
	)
}

export default More;
