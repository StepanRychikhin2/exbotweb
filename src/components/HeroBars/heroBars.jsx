import { useApp } from '../../context/AppContext';
import { copy } from '../../mivo/copy';
import { bindStyles } from '../../styles/bindStyles';
import styles from './heroBars.module.css';

function HeroBars() {
	const { t } = useApp()
	return (
		<div className={bindStyles(styles, "hero-bars")}>
			{[
				['food', 5250, 100],
				['shopping', 2900, 55],
				['transport', 2180, 42],
				['games', 1450, 28],
			].map(([id, v, w]) => (
				<div key={id}>
					<div>
						<span>
							{copy[t('today') === 'Today' ? 'en' : 'uk'][id] ||
								{
									food: t('today') === 'Today' ? 'Food' : 'Їжа',
									shopping: t('today') === 'Today' ? 'Shopping' : 'Покупки',
									transport: t('today') === 'Today' ? 'Transport' : 'Транспорт',
									games: t('today') === 'Today' ? 'Games' : 'Ігри',
								}[id]}
						</span>
						<strong>{v.toLocaleString('uk-UA')} ₴</strong>
					</div>
					<div className={bindStyles(styles, "progress")}>
						<i
							style={{
								width: w + '%',
							}}
						/>
					</div>
				</div>
			))}
		</div>
	)
}

export default HeroBars;
