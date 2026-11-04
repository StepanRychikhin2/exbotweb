import { useApp } from '../../context/AppContext';
import { today } from '../../mivo/model';
import Icon from '../Icon/icon';
import { bindStyles } from '../../styles/bindStyles';
import styles from './chooseCategory.module.css';

function ChooseCategory() {
	const { data, t, name, setModal } = useApp()
	return (
		<>
			<h2 id="dialog-title">{t('selectCategory')}</h2>
			<div className={bindStyles(styles, "category-picker")}>
				{data.categories
					.filter((c) => !c.archived)
					.map((c) => (
						<button
							key={c.id}
							onClick={() =>
								setModal({
									type: 'expense',
									draft: {
										categoryId: c.id,
										date: today(),
										currency: data.currency,
									},
								})
							}
						>
							<span
								className={bindStyles(styles, "category-icon")}
								style={{
									'--category': c.color,
								}}
							>
								<Icon name={c.icon} />
							</span>
							<span>{name(c)}</span>
							<Icon name="chevron" size={17} />
						</button>
					))}
			</div>
		</>
	)
}

export default ChooseCategory;
