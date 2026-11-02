import { useApp } from '../../context/AppContext';
import Icon from '../Icon/icon';
import Brand from '../Brand/brand';
import HeroBars from '../HeroBars/heroBars';
import { bindStyles } from '../../styles/bindStyles';
import styles from './heroPhone.module.css';

function HeroPhone() {
	const { t } = useApp()
	return (
		<div className={bindStyles(styles, "hero-phone")} aria-label={t('heroCardLabel')}>
			<div className={bindStyles(styles, "phone-top")}>
				<Brand />
				<span className={bindStyles(styles, "tag")}>UAH</span>
			</div>
			<p className={bindStyles(styles, "eyebrow")}>{t('todaySpent')}</p>
			<div className={bindStyles(styles, "phone-total")}>
				894 <span>₴</span>
			</div>
			<div className={bindStyles(styles, "phone-stats")}>
				<span>
					{t('monthSpent')}
					<strong>12 480 ₴</strong>
				</span>
				<span>
					{t('dailyAverage')}
					<strong>445,71 ₴</strong>
				</span>
			</div>
			<div className={bindStyles(styles, "phone-chart")}>
				<div className={bindStyles(styles, "section-head")}>
					<h3>{t('whereMoney')}</h3>
					<Icon name="more" size={20} />
				</div>
				<HeroBars />
			</div>
			<div className={bindStyles(styles, "phone-bottom")}>
				{['home', 'list', 'plus', 'grid', 'more'].map((n) => (
					<span key={n} className={bindStyles(styles, n === 'plus' ? 'phone-plus' : '')}>
						<Icon name={n} size={19} />
					</span>
				))}
			</div>
		</div>
	)
}

export default HeroPhone;
