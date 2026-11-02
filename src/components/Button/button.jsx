import Icon from '../Icon/icon';
import { bindStyles } from '../../styles/bindStyles';
import styles from './button.module.css';

function Button({
	children,
	icon,
	secondary = false,
	className = '',
	...props
}) {
	return (
		<button
			className={bindStyles(styles, `button ${secondary ? 'secondary' : 'primary'} ${className}`)}
			{...props}
		>
			{icon && <Icon name={icon} size={19} />}
			<span>{children}</span>
		</button>
	)
}

export default Button;
