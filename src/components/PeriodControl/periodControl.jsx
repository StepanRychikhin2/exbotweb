import { useApp } from '../../context/AppContext';
import Icon from '../Icon/icon';
import { bindStyles } from '../../styles/bindStyles';
import styles from './periodControl.module.css';

function PeriodControl({ period, setPeriod, custom, setCustom }) {
	const { t, setModal } = useApp()
	return (
		<div className={bindStyles(styles, "period-control")}>
			{['today', 'week', 'month'].map((p) => (
				<button
					className={bindStyles(styles, period === p ? 'active' : '')}
					aria-pressed={period === p}
					key={p}
					onClick={() => setPeriod(p)}
				>
					{t(p)}
				</button>
			))}
			<button
				className={bindStyles(styles, period === 'custom' ? 'active' : '')}
				onClick={() =>
					setModal({
						type: 'period',
						custom,
						onApply: (v) => {
							setCustom(v)
							setPeriod('custom')
						},
					})
				}
			>
				<Icon name="calendar" size={16} />
				{t('custom')}
			</button>
		</div>
	)
}

export default PeriodControl;
