import { useApp } from '../../context/AppContext';
import { bindStyles } from '../../styles/bindStyles';
import styles from './currency.module.css';

function Currency() {
	const { data, setData, t } = useApp()
	return (
		<div className={bindStyles(styles, "segmented currency")} aria-label={t('currency')}>
			{['UAH', 'USD'].map((c) => (
				<button
					key={c}
					aria-pressed={data.currency === c}
					onClick={() =>
						setData((d) => ({
							...d,
							currency: c,
						}))
					}
				>
					{c}
				</button>
			))}
		</div>
	)
}

export default Currency;
