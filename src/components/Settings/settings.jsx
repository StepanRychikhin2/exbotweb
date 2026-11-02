import { useApp } from '../../context/AppContext';
import Icon from '../Icon/icon';
import Currency from '../Currency/currency';
import PageTitle from '../PageTitle/pageTitle';
import { bindStyles } from '../../styles/bindStyles';
import styles from './settings.module.css';

function Settings() {
	const { data, setData, t, go } = useApp()
	return (
		<>
			<PageTitle title={t('settings')} sub={t('preferences')} />
			<div className={bindStyles(styles, "more-profile")}>
				<span className={bindStyles(styles, "avatar large")}>M</span>
				<div>
					<h2>{t('demoProfile')}</h2>
					<span className={bindStyles(styles, "muted")}>Telegram · {t('demo')}</span>
				</div>
			</div>
			<div className={bindStyles(styles, "settings-panel")}>
				<div className={bindStyles(styles, "settings-row")}>
					<span>
						<Icon name="globe" />
						{t('language')}
					</span>
					<div className={bindStyles(styles, "segmented")}>
						<button
							aria-pressed={data.lang === 'uk'}
							onClick={() =>
								setData((d) => ({
									...d,
									lang: 'uk',
								}))
							}
						>
							Українська
						</button>
						<button
							aria-pressed={data.lang === 'en'}
							onClick={() =>
								setData((d) => ({
									...d,
									lang: 'en',
								}))
							}
						>
							English
						</button>
					</div>
				</div>
				<div className={bindStyles(styles, "settings-row")}>
					<span>
						<Icon name="moon" />
						{t('theme')}
					</span>
					<div className={bindStyles(styles, "segmented")}>
						{['dark', 'light'].map((theme) => (
							<button
								key={theme}
								aria-pressed={data.theme === theme}
								onClick={() =>
									setData((d) => ({
										...d,
										theme,
									}))
								}
							>
								{t(theme)}
							</button>
						))}
					</div>
				</div>
				<div className={bindStyles(styles, "settings-row")}>
					<span>
						<Icon name="wallet" />
						{t('defaultCurrency')}
					</span>
					<Currency />
				</div>
				<button
					className={bindStyles(styles, "settings-row row-button")}
					onClick={() => go('reminders')}
				>
					<span>
						<Icon name="bell" />
						{t('reminders')}
					</span>
					<Icon name="chevron" size={18} />
				</button>
				<div className={bindStyles(styles, "settings-row")}>
					<span>
						<Icon name="coffee" />
						{t('plan')}
					</span>
					<span>{t('free')}</span>
				</div>
			</div>
			<p className={bindStyles(styles, "explainer")}>
				<Icon name="lock" size={20} />
				{t('localNote')}
			</p>
			<button
				className={bindStyles(styles, "logout-button")}
				onClick={() => {
					setData((d) => ({
						...d,
						authenticated: false,
					}))
					go('landing')
				}}
			>
				<Icon name="logout" size={20} />
				{t('logout')}
			</button>
		</>
	)
}

export default Settings;
