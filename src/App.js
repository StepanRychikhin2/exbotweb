import { useState, useRef, useEffect } from 'react';
import { AppContext } from './context/AppContext';
import { readStored, STORE, money, catName } from './mivo/model';
import { copy } from './mivo/copy';
import Sidebar from './components/Sidebar/sidebar';
import BottomNav from './components/BottomNav/bottomNav';
import Landing from './components/Landing/landing';
import AddExpense from './components/AddExpense/addExpense';
import Overview from './components/Overview/overview';
import History from './components/History/history';
import Categories from './components/Categories/categories';
import CategoryDetail from './components/CategoryDetail/categoryDetail';
import Budget from './components/Budget/budget';
import Reports from './components/Reports/reports';
import More from './components/More/more';
import Settings from './components/Settings/settings';
import Reminders from './components/Reminders/reminders';
import Modal from './components/Modal/modal';
import Header from './components/Header/header';
import Toast from './components/Toast/toast';
import { bindStyles } from './styles/bindStyles';
import styles from './App.module.css';

function App() {
	const [data, setData] = useState(readStored)
	const [route, setRoute] = useState(
		() =>
			window.location.hash.slice(1) || (data.authenticated ? 'add' : 'landing'),
	)
	const [modal, setModal] = useState(null)
	const [toast, setToast] = useState(null)
	const titleRef = useRef(null)
	const t = (k) => copy[data.lang][k] || copy.uk[k] || k
	const go = (r) => {
		if (window.location.hash.slice(1) === r) setRoute(r)
		else window.location.hash = r
	}
	useEffect(() => {
		const f = () => {
			setRoute(window.location.hash.slice(1) || 'landing')
			window.scrollTo({
				top: 0,
			})
		}
		window.addEventListener('hashchange', f)
		return () => window.removeEventListener('hashchange', f)
	}, [])
	useEffect(() => {
		document.documentElement.dataset.theme = data.theme
		document.documentElement.lang = data.lang
		try {
			localStorage.setItem(STORE, JSON.stringify(data))
		} catch {
			setToast({
				text: copy[data.lang].storageError,
			})
		}
	}, [data])
	useEffect(() => {
		if (!toast) return
		const id = setTimeout(() => setToast(null), toast.undo ? 10000 : 5000)
		return () => clearTimeout(id)
	}, [toast])
	const notify = (text, undo) =>
		setToast({
			text,
			undo,
		})
	const fmt = (n, c = data.currency) => money(n, c, data.lang)
	const name = (c) => catName(c, data.lang)
	const desc = (e) => (data.lang === 'en' && e.en ? e.en : e.description)
	const start = () =>
		data.authenticated
			? go('add')
			: setModal({
					type: 'login',
				})
	const value = {
		data,
		setData,
		t,
		go,
		route,
		modal,
		setModal,
		notify,
		fmt,
		name,
		desc,
		start,
	}
	const page = route.split('/')[0]
	const isLanding = page === 'landing' || !data.authenticated
	useEffect(() => {
		if (!isLanding)
			titleRef.current?.focus({
				preventScroll: true,
			})
	}, [route, isLanding])
	const sections = {
		add: <AddExpense />,
		overview: <Overview />,
		expenses: <History />,
		categories: <Categories />,
		category: <CategoryDetail id={route.split('/')[1]} />,
		budget: <Budget />,
		reports: <Reports />,
		more: <More />,
		settings: <Settings />,
		reminders: <Reminders />,
	}
	return (
		<AppContext.Provider value={value}>
			<a
				className={bindStyles(styles, "skip-link")}
				href="#main-content"
				onClick={(e) => {
					e.preventDefault()
					document.getElementById('main-content')?.focus()
				}}
			>
				{data.lang === 'uk' ? 'До вмісту' : 'Skip to content'}
			</a>
			{isLanding ? (
				<Landing />
			) : (
				<div className={bindStyles(styles, "app-shell")}>
					<Sidebar />
					<div className={bindStyles(styles, "workspace")}>
						<Header />
						<main
							id="main-content"
							tabIndex={-1}
							className={bindStyles(styles, `app-main page-${page}`)}
							ref={titleRef}
						>
							{sections[page] || <AddExpense />}
						</main>
						<BottomNav />
					</div>
				</div>
			)}
			{modal && (
				<Modal
					key={
						modal.type + '-' + (modal.expense?.id || modal.category?.id || '')
					}
				/>
			)}
			{toast && (
				<Toast toast={toast} onClose={() => setToast(null)} />
			)}
		</AppContext.Provider>
	)
}

export default App;
