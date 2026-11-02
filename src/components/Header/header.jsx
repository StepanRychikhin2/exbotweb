import { useApp } from '../../context/AppContext';
import Brand from '../Brand/brand';
import IconButton from '../IconButton/iconButton';
import Currency from '../Currency/currency';
import { bindStyles } from '../../styles/bindStyles';
import styles from './header.module.css';

function Header() {
	const { go, t } = useApp()
	return (
		<header className={bindStyles(styles, "app-top")}>
			<button
				className={bindStyles(styles, "brand-link mobile-brand")}
				onClick={() => go('add')}
			>
				<Brand />
			</button>
			<span className={bindStyles(styles, "desktop-welcome")}>{t('demoNotice')}</span>
			<div className={bindStyles(styles, "top-tools")}>
				<Currency />
				<IconButton
					icon="bell"
					label={t('notice')}
					onClick={() => go('reminders')}
				/>
				<button
					className={bindStyles(styles, "avatar")}
					aria-label={t('profile')}
					onClick={() => go('settings')}
				>
					M
				</button>
			</div>
		</header>
	)
}

export default Header;
