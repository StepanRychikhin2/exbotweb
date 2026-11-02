import { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import IconButton from '../IconButton/iconButton';
import Login from '../Login/login';
import ChooseCategory from '../ChooseCategory/chooseCategory';
import ExpenseForm from '../ExpenseForm/expenseForm';
import DeleteForm from '../DeleteForm/deleteForm';
import PeriodForm from '../PeriodForm/periodForm';
import FiltersForm from '../FiltersForm/filtersForm';
import CategoryForm from '../CategoryForm/categoryForm';
import BudgetForm from '../BudgetForm/budgetForm';
import ReminderForm from '../ReminderForm/reminderForm';
import { bindStyles } from '../../styles/bindStyles';
import styles from './modal.module.css';

function Modal() {
	const { modal, setModal, t } = useApp()
	const ref = useRef(null)
	useEffect(() => {
		const previous = document.activeElement
		const dialog = ref.current
		dialog.showModal()
		return () => {
			if (dialog.open) dialog.close()
			previous?.focus?.()
		}
	}, [])
	const contents = {
		login: <Login />,
		expense: <ExpenseForm />,
		chooseCategory: <ChooseCategory />,
		category: <CategoryForm />,
		period: <PeriodForm />,
		filters: <FiltersForm />,
		budget: <BudgetForm />,
		reminder: <ReminderForm />,
		delete: <DeleteForm />,
	}
	return (
		<dialog
			className={bindStyles(styles, `modal modal-${modal.type}`)}
			ref={ref}
			aria-labelledby="dialog-title"
			onCancel={(e) => {
				e.preventDefault()
				setModal(null)
			}}
			onClick={(e) => {
				if (e.target === ref.current) setModal(null)
			}}
		>
			<div className={bindStyles(styles, "modal-inner")}>
				<div className={bindStyles(styles, "sheet-handle")} />
				<IconButton
					icon="close"
					label={t('close')}
					className={bindStyles(styles, "modal-close")}
					onClick={() => setModal(null)}
				/>
				{contents[modal.type]}
			</div>
		</dialog>
	)
}

export default Modal;
