import { useApp } from '../../context/AppContext';
import Icon from '../Icon/icon';
import Button from '../Button/button';
import { bindStyles } from '../../styles/bindStyles';
import styles from './deleteForm.module.css';

function DeleteForm() {
	const { modal, setModal, setData, t, desc, fmt, notify } = useApp()
	const row = modal.expense
	return (
		<>
			<span className={bindStyles(styles, "delete-icon")}>
				<Icon name="trash" size={28} />
			</span>
			<h2 id="dialog-title">{t('deleteTitle')}</h2>
			<p className={bindStyles(styles, "modal-sub")}>{t('deleteSub')}</p>
			<div className={bindStyles(styles, "delete-summary")}>
				<strong>{desc(row)}</strong>
				<span>{fmt(row.amount, row.currency)}</span>
			</div>
			<Button
				className={bindStyles(styles, "wide destructive")}
				icon="trash"
				onClick={() => {
					setData((d) => ({
						...d,
						expenses: d.expenses.filter((e) => e.id !== row.id),
					}))
					setModal(null)
					notify(t('deleted'), () =>
						setData((d) => ({
							...d,
							expenses: d.expenses.some((e) => e.id === row.id)
								? d.expenses
								: [...d.expenses, row],
						})),
					)
				}}
			>
				{t('delete')}
			</Button>
			<Button
				className={bindStyles(styles, "wide")}
				secondary
				onClick={() =>
					setModal({
						type: 'expense',
						expense: row,
					})
				}
			>
				{t('cancel')}
			</Button>
		</>
	)
}

export default DeleteForm;
