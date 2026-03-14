<script lang="ts">
	import { fromStore } from 'svelte/store';
	import { domainCatalog } from '$lib/app-data';
	import { getDomainSummaries, vetplay } from '$lib/stores/vetplay';

	const app = fromStore(vetplay);
	let selectedDomainId = $state(domainCatalog[0].id);

	const summaries = $derived(getDomainSummaries(app.current));
	const selectedDomain = $derived(
		domainCatalog.find((domain) => domain.id === selectedDomainId) ?? domainCatalog[0]
	);
	const selectedSummary = $derived(
		summaries.find((summary) => summary.id === selectedDomainId) ?? summaries[0]
	);
</script>

<section class="hero-card compact">
	<div>
		<p class="section-kicker">Carte de compétences</p>
		<h2>Choisir un domaine lance une activité réelle.</h2>
		<p class="muted">
			Chaque lancement augmente la maîtrise, rapporte de l’XP et met à jour la progression
			immédiatement dans l’interface.
		</p>
	</div>

	<div class="hero-stats">
		<div>
			<strong>{summaries.filter((summary) => summary.progress >= 0.6).length}</strong>
			<span>domaines solides</span>
		</div>
		<div>
			<strong>{summaries.reduce((total, summary) => total + summary.totalRuns, 0)}</strong>
			<span>sessions lancées</span>
		</div>
	</div>
</section>

<section class="section-block">
	<div class="section-head">
		<div>
			<p class="section-kicker">Domaines</p>
			<h3>Progression détaillée</h3>
		</div>
	</div>

	<div class="domain-pill-grid">
		{#each summaries as summary}
			<button
				type="button"
				class={`domain-pill ${selectedDomainId === summary.id ? 'active' : ''}`}
				onclick={() => (selectedDomainId = summary.id)}
			>
				<span>{summary.name}</span>
				<strong>{Math.round(summary.progress * 100)}%</strong>
			</button>
		{/each}
	</div>
</section>

<section class="domain-focus-card">
	<div class="domain-focus-copy">
		<p class="section-kicker">Focus</p>
		<h3>{selectedDomain.name}</h3>
		<p class="muted">{selectedDomain.description}</p>
		<p class="domain-goal">{selectedDomain.goal}</p>
	</div>

	<div class="domain-focus-stats">
		<div>
			<span>Niveau</span>
			<strong>{selectedSummary.level}</strong>
		</div>
		<div>
			<span>Maîtrise</span>
			<strong>{selectedSummary.mastery}%</strong>
		</div>
	</div>
</section>

<section class="section-block">
	<div class="section-head">
		<div>
			<p class="section-kicker">Activités</p>
			<h3>Lancer une session</h3>
		</div>
	</div>

	<div class="domain-list">
		{#each selectedDomain.activities as activity}
			<article class="domain-card">
				<div class="domain-head">
					<div>
						<h4>{activity.title}</h4>
						<p>{activity.kind}</p>
					</div>
					<strong>+{activity.xp} XP</strong>
				</div>

				<p>{activity.description}</p>

				<div class="shop-footer wrap-actions">
					<span class="pill-label">
						Lancé {app.current.activityRuns[activity.id] ?? 0} fois
					</span>
					<button
						type="button"
						class="primary-button"
						onclick={() => vetplay.runActivity(activity.id, activity.xp, activity.coins)}
					>
						Lancer l’activité
					</button>
				</div>
			</article>
		{/each}
	</div>
</section>
