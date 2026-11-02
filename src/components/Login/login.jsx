import { useApp } from '../../context/AppContext';
import Icon from '../Icon/icon';
import Button from '../Button/button';
import { bindStyles } from '../../styles/bindStyles';
import styles from './login.module.css';

function Login() {
	const { setData, t, setModal, go } = useApp()
	return (
		<div className={bindStyles(styles, "login-modal")}>
			<span className={bindStyles(styles, "login-icon")}>
				<Icon name="plane" size={34} />
			</span>
			<span className={bindStyles(styles, "tag")}>{t('demo')}</span>
			<h2 id="dialog-title">{t('loginTitle')}</h2>
			<p>{t('loginSub')}</p>
			<Button
				className={bindStyles(styles, "wide")}
				icon="arrow"
				onClick={() => {
					setData((d) => ({
						...d,
						authenticated: true,
					}))
					setModal(null)
					go('add')
				}}
			>
				{t('demoLogin')}
			</Button>
			<small>{t('loginFoot')}</small>
		</div>
	)
}

export default Login;
