import { useApp } from '../../context/AppContext';
import { comparison, dateText } from '../../mivo/model';
import Icon from '../Icon/icon';
import { bindStyles } from '../../styles/bindStyles';
import styles from './comparison.module.css';

function Comparison({ categoryId = '' }) {
	const { data, t } = useApp()
	const c = comparison(data.expenses, data.currency, categoryId)
	return (
		<div className={bindStyles(styles, "comparison")}>
			<Icon name="chart" />
			<div>
				<strong>
					{c.percent === null
						? t('noComparison')
						: c.percent === 0
							? t('same')
							: `${Math.abs(c.percent)}% ${t(c.percent < 0 ? 'less' : 'moreSpent')}`}
				</strong>
				<span>{t('comparison')}</span>
				<small>
					{t('sameDays')}: {dateText(c.prevFrom, data.lang)} –{' '}
					{dateText(c.prevTo, data.lang)}
				</small>
			</div>
		</div>
	)
}

export default Comparison;
