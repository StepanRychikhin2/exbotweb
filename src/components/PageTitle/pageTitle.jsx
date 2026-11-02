import { useApp } from '../../context/AppContext';
import { today } from '../../myex/model';
import Icon from '../Icon/icon';
import { bindStyles } from '../../styles/bindStyles';
import styles from './pageTitle.module.css';

function PageTitle({ title, sub, action, back }) {
	const { go, t } = useApp()
	return (
		<div className={bindStyles(styles, "page-heading")}>
			{back && (
				<button className={bindStyles(styles, "back-link")} onClick={() => go(back)}>
					<Icon name="back" size={18} />
					{t('back')}
				</button>
			)}
			<div>
				<div>
					<p className={bindStyles(styles, "eyebrow")}>
						{new Intl.DateTimeFormat(
							t('today') === 'Today' ? 'en-GB' : 'uk-UA',
							{
								weekday: 'long',
								day: 'numeric',
								month: 'long',
							},
						).format(new Date(today() + 'T12:00:00'))}
					</p>
					<h1>{title}</h1>
					{sub && <p className={bindStyles(styles, "subtitle")}>{sub}</p>}
				</div>
				{action}
			</div>
		</div>
	)
}

export default PageTitle;
