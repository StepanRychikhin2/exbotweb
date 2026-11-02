import { useApp } from '../../context/AppContext';
import Icon from '../Icon/icon';
import IconButton from '../IconButton/iconButton';
import { bindStyles } from '../../styles/bindStyles';
import styles from './toast.module.css';

function Toast({ toast, onClose }) {
	const { t } = useApp()
	return (
		<div className={bindStyles(styles, "toast")} role="status">
			<span className={bindStyles(styles, "toast-mark")}>
				<Icon name="check" size={18} />
			</span>
			<span>{toast.text}</span>
			{toast.undo && (
				<button
					onClick={() => {
						toast.undo()
						onClose()
					}}
				>
					{t('undo')}
				</button>
			)}
			<IconButton
				icon="close"
				label={t('close')}
				onClick={() => onClose()}
			/>
		</div>
	)
}

export default Toast;
