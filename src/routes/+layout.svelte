<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { fromStore } from 'svelte/store';
	import { getPlayerLevel, vetplay } from '$lib/stores/vetplay';

	let { children } = $props();
	const app = fromStore(vetplay);

	const navigation = [
		{ href: '/', label: 'Accueil', icon: '🏠' },
		{ href: '/rappels', label: 'Rappels', icon: '⏰' },
		{ href: '/progression', label: 'Progression', icon: '📚' },
		{ href: '/boutique', label: 'Boutique', icon: '🛍️' },
		{ href: '/profil', label: 'Profil', icon: '🐶' }
	];

	const titles: Record<string, { eyebrow: string; title: string }> = {
		'/': { eyebrow: 'VetPlay', title: 'Parcours quotidien' },
		'/rappels': { eyebrow: 'Vaccination', title: 'Vaccins & rappels' },
		'/progression': { eyebrow: 'Apprentissage', title: 'Progression par domaine' },
		'/boutique': { eyebrow: 'Avatar', title: 'Boutique cosmétique' },
		'/profil': { eyebrow: 'Compagnon', title: 'Profil & avatar' }
	};

	const normalizePath = (pathname: string) =>
		pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
	const getHeader = (pathname: string) => titles[normalizePath(pathname)] ?? titles['/'];
	const isActive = (href: string, pathname: string) =>
		normalizePath(href) === normalizePath(pathname);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<title>VetPlay</title>
</svelte:head>

<div class="app-shell">
	<div class="forest-layer" aria-hidden="true">
		<span class="forest-tree tree-1"></span>
		<span class="forest-tree tree-2"></span>
		<span class="forest-tree tree-3"></span>
		<span class="forest-tree tree-4"></span>
		<span class="forest-tree tree-5"></span>
		<span class="forest-tree tree-6"></span>
		<span class="forest-tree tree-7"></span>
		<span class="forest-tree tree-8"></span>
	</div>

	<div class="app-frame">
		<header class="topbar">
			<div>
				<p class="eyebrow">{getHeader(page.url.pathname).eyebrow}</p>
				<h1>{getHeader(page.url.pathname).title}</h1>
			</div>

			<div class="topbar-chip">
				<span class="chip-dot"></span>
				<span>🔥 {app.current.streak} j · Lv {getPlayerLevel(app.current.xp)}</span>
			</div>
		</header>

		<main class="content">
			{@render children()}
		</main>

		<nav class="bottom-nav" aria-label="Navigation principale">
			{#each navigation as item}
				<a
					href={item.href}
					class:active={isActive(item.href, page.url.pathname)}
					aria-current={isActive(item.href, page.url.pathname) ? 'page' : undefined}
				>
					<span class="nav-icon" aria-hidden="true">{item.icon}</span>
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>
	</div>
</div>
