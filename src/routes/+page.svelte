<script lang="ts">
	import { fromStore } from 'svelte/store';
	import { domainCatalog, journeyNodes, totalJourneyXp } from '$lib/app-data';
	import {
		getDailyChallengeNodes,
		getDomainSummaries,
		getNodeStatus,
		getPlayerLevel,
		getTotalActivityRuns,
		getTotalCompletedNodes,
		vetplay
	} from '$lib/stores/vetplay';

	const app = fromStore(vetplay);
	let selectedNodeId = $state<string | null>(null);

	const completedCount = $derived(getTotalCompletedNodes(app.current));
	const nextNode = $derived(journeyNodes[completedCount] ?? null);
	const totalCoinsOnMap = journeyNodes.reduce((total, node) => total + node.coins, 0);
	const level = $derived(getPlayerLevel(app.current.xp));
	const xpPerLevel = 180;
	const xpIntoLevel = $derived(app.current.xp % xpPerLevel);
	const xpProgressPercent = $derived(Math.round((xpIntoLevel / xpPerLevel) * 100));
	const dailyChallengeNodes = $derived(getDailyChallengeNodes(app.current));
	const nextSuggestedNode = $derived(
		dailyChallengeNodes.find((node) => !app.current.completedJourneyNodeIds.includes(node.id)) ??
			nextNode
	);
	const avatarNodeId = $derived(
		nextSuggestedNode?.id ??
			app.current.completedJourneyNodeIds[app.current.completedJourneyNodeIds.length - 1] ??
			journeyNodes[0]?.id ??
			null
	);
	const domainSummaries = $derived(getDomainSummaries(app.current));
	const recentAchievements = $derived.by(() =>
		app.current.completedJourneyNodeIds
			.slice(-3)
			.map((nodeId) => journeyNodes.find((node) => node.id === nodeId))
			.filter((node): node is (typeof journeyNodes)[number] => Boolean(node))
	);

	const selectedNode = $derived(
		journeyNodes.find((node) => node.id === selectedNodeId) ??
			nextNode ??
			journeyNodes[Math.max(completedCount - 1, 0)] ??
			journeyNodes[0]
	);
	const selectedNodeIndex = $derived(
		Math.max(
			0,
			journeyNodes.findIndex((node) => node.id === selectedNode.id)
		)
	);
	const selectedStatus = $derived(getNodeStatus(app.current, selectedNode.id, selectedNodeIndex));

	function playNode(nodeId: string, xp: number, coins: number) {
		vetplay.completeJourneyNode(nodeId, xp, coins);
	}

	const completionPercent = $derived(
		Math.round((getTotalCompletedNodes(app.current) / journeyNodes.length) * 100)
	);

	$effect(() => {
		selectedNodeId =
			nextNode?.id ??
			app.current.completedJourneyNodeIds[app.current.completedJourneyNodeIds.length - 1] ??
			journeyNodes[0]?.id ??
			null;
	});
</script>

<section class="dashboard-intro">
	<div class="dashboard-intro-copy">
		<h2>Salut, {app.current.playerName} !</h2>
		<p>Prêt à faire progresser {app.current.dogName} aujourd’hui ?</p>
	</div>

	<div class="dashboard-stats-inline">
		<div class="stat-pill stat-pill-fire">🔥 {app.current.streak} jours</div>
		<div class="stat-pill stat-pill-gem">{app.current.coins} VC</div>
	</div>
</section>

<section class="player-summary-card motion-rise delay-1">
	<div class="summary-avatar">
		{#if app.current.avatarImage}
			<img src={app.current.avatarImage} alt={`Avatar de ${app.current.dogName}`} />
		{:else}
			<span aria-hidden="true">🐾</span>
		{/if}
	</div>

	<div class="player-summary-copy">
		<div class="player-summary-head">
			<div>
				<h3>{app.current.playerName}</h3>
				<p>{app.current.dogName} · Aventurier vétérinaire</p>
			</div>
			<span class="summary-pill">Niveau {level}</span>
		</div>

		<div class="xp-card">
			<div class="xp-card-head">
				<span>Progression XP</span>
				<strong>{xpIntoLevel}/{xpPerLevel}</strong>
			</div>
			<div class="progress-line large">
				<div style={`width:${xpProgressPercent}%`}></div>
			</div>
			<p>{xpPerLevel - xpIntoLevel} XP avant le niveau suivant.</p>
		</div>
	</div>
</section>

<section class="section-block motion-rise delay-2">
	<div class="section-head">
		<div>
			<p class="section-kicker">Défis du jour</p>
			<h3>À valider aujourd’hui</h3>
		</div>
	</div>

	{#if dailyChallengeNodes.length > 0}
		<div class="daily-challenge-list">
			{#each dailyChallengeNodes as challenge}
				{@const challengeIndex = journeyNodes.findIndex((node) => node.id === challenge.id)}
				{@const challengeStatus = getNodeStatus(app.current, challenge.id, challengeIndex)}
				<article class={`daily-challenge-card accent-${challenge.accent}`}>
					<div class="daily-challenge-head">
						<div>
							<p class="section-kicker">Monde {challenge.world}-{challenge.stage}</p>
							<h4>{challenge.title}</h4>
						</div>
						<span class={`journey-status-pill journey-status-${challengeStatus}`}>
							{challengeStatus === 'completed'
								? 'Validé'
								: challengeStatus === 'active'
									? 'À valider'
									: 'À venir'}
						</span>
					</div>

					<p class="muted">{challenge.description}</p>

					<div class="activity-tags">
						<span>{challenge.kind}</span>
						<span>{challenge.duration}</span>
						<span>+{challenge.xp} XP</span>
					</div>

					<div class="daily-challenge-actions">
						<button
							type="button"
							class="primary-button"
							disabled={challengeStatus !== 'active'}
							onclick={() => {
								selectedNodeId = challenge.id;
								playNode(challenge.id, challenge.xp, challenge.coins);
							}}
						>
							{challengeStatus === 'completed'
								? 'Défi validé'
								: challengeStatus === 'active'
									? 'Valider le défi'
									: 'Bientôt disponible'}
						</button>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<article class="panel-card completion-card">
			<p class="section-kicker">Défis du jour</p>
			<h3>Tous les défis connus sont validés.</h3>
			<p class="muted">
				Le système proposera de nouveaux défis tant qu’il reste des cases non terminées dans le
				parcours.
			</p>
		</article>
	{/if}
</section>

<section class="section-block motion-rise delay-3">
	<div class="section-head">
		<div>
			<p class="section-kicker">Parcours quotidien</p>
			<h3>Carte complète</h3>
		</div>
		<a href="/progression" class="text-link">Voir les domaines</a>
	</div>

	<div class="journey-map-shell">
		<div class="panel-card journey-map-card">
			<div class="journey-map-head">
				<div>
					<p class="section-kicker">Progression</p>
					<h3>Monde 1 à 3</h3>
				</div>
				<p class="muted journey-map-copy">
					L’avatar se pose sur la prochaine case à jouer, comme un pion de progression.
				</p>
			</div>

			<div class="journey-mini-map">
				<div class="journey-track"></div>
				{#each journeyNodes as node, index}
					{@const status = getNodeStatus(app.current, node.id, index)}
					<div class={`journey-row lane-${node.lane}`}>
						<button
							type="button"
							class={`map-node accent-${node.accent} status-${status} ${selectedNodeId === node.id ? 'selected' : ''}`}
							aria-label={`Case ${node.world}-${node.stage}: ${node.title}`}
							aria-pressed={selectedNodeId === node.id}
							onclick={() => (selectedNodeId = node.id)}
						>
							{#if avatarNodeId === node.id}
								<span class="map-avatar">
									{#if app.current.avatarImage}
										<img src={app.current.avatarImage} alt="" />
									{:else}
										<span aria-hidden="true">🐶</span>
									{/if}
								</span>
							{/if}

							<span class="map-node-stage">{node.world}-{node.stage}</span>
							<span class="map-node-icon" aria-hidden="true">
								{#if status === 'completed'}
									✓
								{:else if node.kind === 'quiz'}
									?
								{:else if node.kind === 'mini-jeu'}
									▶
								{:else}
									+
								{/if}
							</span>
						</button>
					</div>
				{/each}
			</div>
		</div>

		<article class={`activity-card journey-detail-card accent-${selectedNode.accent}`}>
			<div class="journey-detail-head">
				<div>
					<p class="section-kicker">Case sélectionnée</p>
					<h4>{selectedNode.title}</h4>
				</div>
				<span class={`journey-status-pill journey-status-${selectedStatus}`}>
					{selectedStatus === 'completed'
						? 'Terminée'
						: selectedStatus === 'active'
							? 'En cours'
							: 'Verrouillée'}
				</span>
			</div>

			<div class="activity-meta">
				<span>Monde {selectedNode.world}-{selectedNode.stage}</span>
				<span>{domainCatalog.find((domain) => domain.id === selectedNode.domain)?.name}</span>
				<span>{selectedNode.kind}</span>
			</div>

			<p>{selectedNode.description}</p>

			<div class="activity-tags">
				<span>{selectedNode.duration}</span>
				<span>+{selectedNode.xp} XP</span>
				<span>+{selectedNode.coins} VC</span>
			</div>

			<div class="journey-detail-actions">
				<button
					type="button"
					class="primary-button"
					disabled={selectedStatus !== 'active'}
					onclick={() => playNode(selectedNode.id, selectedNode.xp, selectedNode.coins)}
				>
					{selectedStatus === 'active'
						? 'Jouer cette case'
						: selectedStatus === 'completed'
							? 'Case validée'
							: 'Case verrouillée'}
				</button>

				<p class="muted">
					{#if selectedStatus === 'active'}
						Ton avatar est prêt à avancer ici.
					{:else if selectedStatus === 'completed'}
						Cette étape est déjà validée.
					{:else}
						Valide d’abord la case précédente.
					{/if}
				</p>
			</div>
		</article>
	</div>
</section>

{#if nextSuggestedNode}
	<section class="section-block motion-rise delay-4">
		<div class="section-head">
			<div>
				<p class="section-kicker">Continuer</p>
				<h3>Mission recommandée</h3>
			</div>
		</div>

		<button
			type="button"
			class={`continue-card accent-${nextSuggestedNode.accent}`}
			onclick={() => {
				selectedNodeId = nextSuggestedNode.id;
				playNode(nextSuggestedNode.id, nextSuggestedNode.xp, nextSuggestedNode.coins);
			}}
		>
			<div class="continue-card-copy">
				<span class="continue-icon">
					{#if nextSuggestedNode.kind === 'quiz'}
						🧠
					{:else if nextSuggestedNode.kind === 'mini-jeu'}
						🎮
					{:else}
						🩺
					{/if}
				</span>
				<div>
					<h4>{nextSuggestedNode.title}</h4>
					<p>{nextSuggestedNode.description}</p>
				</div>
			</div>
			<span class="continue-arrow" aria-hidden="true">→</span>
		</button>
	</section>
{/if}

<section class="section-block motion-rise delay-5">
	<div class="section-head">
		<div>
			<p class="section-kicker">Stats rapides</p>
			<h3>Vue d’ensemble</h3>
		</div>
	</div>

	<div class="quick-grid">
		<article class="quick-stat-card">
			<span class="quick-icon">📘</span>
			<strong>{completedCount}</strong>
			<p>Cases terminées</p>
		</article>
		<article class="quick-stat-card">
			<span class="quick-icon">🏆</span>
			<strong>{app.current.ownedCosmeticIds.length}</strong>
			<p>Récompenses obtenues</p>
		</article>
		<article class="quick-stat-card">
			<span class="quick-icon">⚡</span>
			<strong>{getTotalActivityRuns(app.current)}</strong>
			<p>Activités rejouées</p>
		</article>
		<article class="quick-stat-card">
			<span class="quick-icon">🌟</span>
			<strong>{completionPercent}%</strong>
			<p>Chemin complété</p>
		</article>
	</div>
</section>

{#if recentAchievements.length > 0}
	<section class="section-block motion-rise delay-6">
		<div class="section-head">
			<div>
				<p class="section-kicker">Dernières réussites</p>
				<h3>Succès récents</h3>
			</div>
		</div>

		<div class="achievement-row">
			{#each recentAchievements as achievement}
				<article class={`achievement-card accent-${achievement.accent}`}>
					<span class="achievement-icon">
						{#if achievement.kind === 'quiz'}
							🧠
						{:else if achievement.kind === 'mini-jeu'}
							🎯
						{:else}
							🩺
						{/if}
					</span>
					<h4>{achievement.title}</h4>
					<p>Monde {achievement.world}-{achievement.stage}</p>
				</article>
			{/each}
		</div>
	</section>
{/if}

<section class="section-block motion-rise delay-7">
	<div class="section-head">
		<div>
			<p class="section-kicker">Thèmes</p>
			<h3>Aperçu des domaines</h3>
		</div>
		<a href="/progression" class="text-link">Voir tout →</a>
	</div>

	<div class="theme-grid">
		{#each domainSummaries as summary, index}
			<a href="/progression" class="theme-card">
				<span class="theme-icon">
					{#if index === 0}
						🚑
					{:else if index === 1}
						🩻
					{:else if index === 2}
						💊
					{:else}
						🥣
					{/if}
				</span>
				<strong>{summary.name}</strong>
				<p>{Math.round(summary.progress * 100)}% complété</p>
			</a>
		{/each}
	</div>
</section>

<section class="section-block motion-rise delay-8">
	<div class="section-head">
		<div>
			<p class="section-kicker">Récompense globale</p>
			<h3>Objectif du chemin</h3>
		</div>
	</div>

	<article class="activity-card accent-gold">
		<div class="activity-meta">
			<span>Progression complète</span>
			<span>{journeyNodes.length} cases</span>
		</div>
		<h4>Vide le chemin du jour</h4>
		<p>
			Récompense totale du parcours: {totalJourneyXp} XP et {totalCoinsOnMap} VetCoins si tu termines
			toutes les cases.
		</p>
		<div class="progress-line large">
			<div style={`width:${completionPercent}%`}></div>
		</div>
	</article>
</section>
