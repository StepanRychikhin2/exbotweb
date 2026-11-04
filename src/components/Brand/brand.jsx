import { bindStyles } from '../../styles/bindStyles';
import styles from './brand.module.css';

function Brand() {
	return (
		<span className={bindStyles(styles, "brand")}>
			Mi<span>vo</span>
			<i />
		</span>
	)
}

export default Brand;
