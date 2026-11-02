import Icon from '../Icon/icon';
import { bindStyles } from '../../styles/bindStyles';
import styles from './iconButton.module.css';

function IconButton({ icon, label, className = '', ...props }) {
	return (
		<button
			className={bindStyles(styles, `icon-button ${className}`)}
			aria-label={label}
			title={label}
			{...props}
		>
			<Icon name={icon} />
		</button>
	)
}

export default IconButton;
