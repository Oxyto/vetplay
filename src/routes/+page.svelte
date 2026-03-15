<script lang="ts">
	import { fromStore } from 'svelte/store';
	import {
		domainCatalog,
		journeyActivityScenarios,
		journeyNodes,
		totalJourneyXp
	} from '$lib/app-data';
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
	let activeSessionNodeId = $state<string | null>(null);
	let selectedCaseOptionIndex = $state<number | null>(null);
	let selectedQuizChoiceIndex = $state<number | null>(null);
	let quizQuestionIndex = $state(0);
	let miniHits = $state<string[]>([]);
	let miniMisses = $state<string[]>([]);
	const miniMaxMistakes = 2;

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
	const activeSessionNode = $derived(
		activeSessionNodeId
			? (journeyNodes.find((node) => node.id === activeSessionNodeId) ?? null)
			: null
	);
	const activeSessionScenario = $derived(
		activeSessionNodeId ? (journeyActivityScenarios[activeSessionNodeId] ?? null) : null
	);
	const activeCaseScenario = $derived(
		activeSessionScenario?.kind === 'case' ? activeSessionScenario : null
	);
	const activeQuizScenario = $derived(
		activeSessionScenario?.kind === 'quiz' ? activeSessionScenario : null
	);
	const activeMiniGameScenario = $derived(
		activeSessionScenario?.kind === 'mini-jeu' ? activeSessionScenario : null
	);
	const selectedCaseOption = $derived(
		activeCaseScenario && selectedCaseOptionIndex !== null
			? (activeCaseScenario.options[selectedCaseOptionIndex] ?? null)
			: null
	);
	const currentQuizQuestion = $derived(
		activeQuizScenario ? (activeQuizScenario.questions[quizQuestionIndex] ?? null) : null
	);
	const quizChoiceIsCorrect = $derived(
		Boolean(
			currentQuizQuestion &&
			selectedQuizChoiceIndex !== null &&
			selectedQuizChoiceIndex === currentQuizQuestion.correctIndex
		)
	);
	const miniGameCompleted = $derived(
		Boolean(activeMiniGameScenario && miniHits.length >= activeMiniGameScenario.goal)
	);
	const miniGameFailed = $derived(miniMisses.length >= miniMaxMistakes);
	const quizProgressPercent = $derived(
		activeQuizScenario
			? Math.round(((quizQuestionIndex + 1) / activeQuizScenario.questions.length) * 100)
			: 0
	);
	const miniProgressPercent = $derived(
		activeMiniGameScenario ? Math.round((miniHits.length / activeMiniGameScenario.goal) * 100) : 0
	);

	function getNodeRuntimeStatus(nodeId: string) {
		const nodeIndex = journeyNodes.findIndex((node) => node.id === nodeId);
		return nodeIndex >= 0 ? getNodeStatus(app.current, nodeId, nodeIndex) : 'locked';
	}

	function resetSessionState() {
		selectedCaseOptionIndex = null;
		selectedQuizChoiceIndex = null;
		quizQuestionIndex = 0;
		miniHits = [];
		miniMisses = [];
	}

	function openNodeSession(nodeId: string) {
		if (getNodeRuntimeStatus(nodeId) !== 'active') return;
		selectedNodeId = nodeId;
		activeSessionNodeId = nodeId;
		resetSessionState();
	}

	function closeNodeSession() {
		activeSessionNodeId = null;
		resetSessionState();
	}

	function completeActiveSession() {
		if (!activeSessionNode) return;
		vetplay.completeJourneyNode(
			activeSessionNode.id,
			activeSessionNode.xp,
			activeSessionNode.coins
		);
		closeNodeSession();
	}

	function chooseCaseOption(index: number) {
		if (selectedCaseOptionIndex !== null) return;
		selectedCaseOptionIndex = index;
	}

	function retryCase() {
		selectedCaseOptionIndex = null;
	}

	function chooseQuizOption(index: number) {
		selectedQuizChoiceIndex = index;
	}

	function advanceQuiz() {
		if (!activeQuizScenario || !currentQuizQuestion || selectedQuizChoiceIndex === null) return;

		if (selectedQuizChoiceIndex !== currentQuizQuestion.correctIndex) {
			selectedQuizChoiceIndex = null;
			return;
		}

		if (quizQuestionIndex < activeQuizScenario.questions.length - 1) {
			quizQuestionIndex += 1;
			selectedQuizChoiceIndex = null;
			return;
		}

		completeActiveSession();
	}

	function chooseMiniTarget(targetId: string) {
		if (!activeMiniGameScenario || miniGameCompleted || miniGameFailed) return;
		if (miniHits.includes(targetId) || miniMisses.includes(targetId)) return;

		const target = activeMiniGameScenario.targets.find((entry) => entry.id === targetId);
		if (!target) return;

		if (target.correct) {
			miniHits = [...miniHits, targetId];
			return;
		}

		miniMisses = [...miniMisses, targetId];
	}

	function restartMiniGame() {
		miniHits = [];
		miniMisses = [];
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

	$effect(() => {
		if (!activeSessionNodeId || typeof window === 'undefined' || typeof document === 'undefined') {
			return;
		}

		const scrollY = window.scrollY;
		const bodyStyle = document.body.style;
		const htmlStyle = document.documentElement.style;
		const previousBodyOverflow = bodyStyle.overflow;
		const previousBodyPosition = bodyStyle.position;
		const previousBodyTop = bodyStyle.top;
		const previousBodyLeft = bodyStyle.left;
		const previousBodyRight = bodyStyle.right;
		const previousBodyWidth = bodyStyle.width;
		const previousBodyTouchAction = bodyStyle.touchAction;
		const previousHtmlOverflow = htmlStyle.overflow;
		const previousHtmlOverscroll = htmlStyle.overscrollBehavior;

		htmlStyle.overflow = 'hidden';
		htmlStyle.overscrollBehavior = 'none';
		bodyStyle.overflow = 'hidden';
		bodyStyle.position = 'fixed';
		bodyStyle.top = `-${scrollY}px`;
		bodyStyle.left = '0';
		bodyStyle.right = '0';
		bodyStyle.width = '100%';
		bodyStyle.touchAction = 'none';

		return () => {
			htmlStyle.overflow = previousHtmlOverflow;
			htmlStyle.overscrollBehavior = previousHtmlOverscroll;
			bodyStyle.overflow = previousBodyOverflow;
			bodyStyle.position = previousBodyPosition;
			bodyStyle.top = previousBodyTop;
			bodyStyle.left = previousBodyLeft;
			bodyStyle.right = previousBodyRight;
			bodyStyle.width = previousBodyWidth;
			bodyStyle.touchAction = previousBodyTouchAction;
			window.scrollTo(0, scrollY);
		};
	});
</script>

<section class="dashboard-intro">
	<div class="dashboard-intro-head">
		<h2>Salut, {app.current.playerName} !</h2>
		<div class="dashboard-stats-inline">
			<div class="stat-pill stat-pill-fire">🔥 {app.current.streak} jours</div>
			<div class="stat-pill stat-pill-gem">{app.current.coins} VC</div>
		</div>
	</div>

	<p>Prêt à faire progresser {app.current.dogName} aujourd’hui ?</p>
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
								openNodeSession(challenge.id);
							}}
						>
							{challengeStatus === 'completed'
								? 'Défi validé'
								: challengeStatus === 'active'
									? 'Lancer le défi'
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
					onclick={() => openNodeSession(selectedNode.id)}
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
				openNodeSession(nextSuggestedNode.id);
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

{#if activeSessionNode && activeSessionScenario}
	<div
		class="activity-overlay"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) {
				closeNodeSession();
			}
		}}
	>
		<dialog
			open
			class={`activity-sheet accent-${activeSessionNode.accent}`}
			aria-labelledby="activity-session-title"
		>
			<div class="activity-sheet-head">
				<div>
					<p class="section-kicker">
						Monde {activeSessionNode.world}-{activeSessionNode.stage} · {activeSessionNode.kind}
					</p>
					<h3 id="activity-session-title">{activeSessionNode.title}</h3>
				</div>

				<button type="button" class="ghost-button" onclick={closeNodeSession}>Fermer</button>
			</div>

			<p class="muted">{activeSessionNode.description}</p>

			{#if activeCaseScenario}
				<p class="session-lead">{activeCaseScenario.intro}</p>
				<div class="session-prompt">
					<strong>{activeCaseScenario.question}</strong>
				</div>

				<div class="session-options">
					{#each activeCaseScenario.options as option, index}
						<button
							type="button"
							class={`session-option ${selectedCaseOptionIndex === index ? 'selected' : ''} ${selectedCaseOptionIndex === index && option.correct ? 'is-correct' : ''} ${selectedCaseOptionIndex === index && !option.correct ? 'is-wrong' : ''}`}
							onclick={() => chooseCaseOption(index)}
							disabled={selectedCaseOptionIndex !== null}
						>
							<span>{option.label}</span>
						</button>
					{/each}
				</div>

				{#if selectedCaseOption}
					<div class={`session-feedback ${selectedCaseOption.correct ? 'success' : 'warning'}`}>
						<strong>
							{selectedCaseOption.correct
								? activeCaseScenario.successText
								: 'Pas encore, reprends le raisonnement clinique.'}
						</strong>
						<p>{selectedCaseOption.feedback}</p>
					</div>

					<div class="session-actions">
						{#if selectedCaseOption.correct}
							<button type="button" class="primary-button" onclick={completeActiveSession}>
								Terminer la case
							</button>
						{:else}
							<button type="button" class="secondary-button" onclick={retryCase}>
								Réessayer
							</button>
						{/if}
					</div>
				{/if}
			{:else if activeQuizScenario && currentQuizQuestion}
				<p class="session-lead">{activeQuizScenario.intro}</p>
				<div class="session-progress">
					<span>Question {quizQuestionIndex + 1}/{activeQuizScenario.questions.length}</span>
					<span>Réponds juste pour avancer</span>
				</div>
				<div class="session-meter" aria-hidden="true">
					<div style={`width:${quizProgressPercent}%`}></div>
				</div>

				{#key `${activeSessionNode.id}-quiz-${quizQuestionIndex}`}
					<div class="session-stage">
						<div class="session-prompt">
							<strong>{currentQuizQuestion.prompt}</strong>
						</div>

						<div class="session-options">
							{#each currentQuizQuestion.choices as choice, index}
								<button
									type="button"
									class={`session-option ${selectedQuizChoiceIndex === index ? 'selected' : ''} ${selectedQuizChoiceIndex === index && index === currentQuizQuestion.correctIndex ? 'is-correct' : ''} ${selectedQuizChoiceIndex === index && index !== currentQuizQuestion.correctIndex ? 'is-wrong' : ''}`}
									onclick={() => chooseQuizOption(index)}
									disabled={selectedQuizChoiceIndex !== null}
								>
									<span>{choice}</span>
								</button>
							{/each}
						</div>
					</div>
				{/key}

				{#if selectedQuizChoiceIndex !== null}
					<div class={`session-feedback ${quizChoiceIsCorrect ? 'success' : 'warning'}`}>
						<strong>
							{quizChoiceIsCorrect ? 'Bonne réponse.' : 'Réponse incorrecte.'}
						</strong>
						<p>{currentQuizQuestion.explanation}</p>
					</div>

					<div class="session-actions">
						<button
							type="button"
							class={quizChoiceIsCorrect ? 'primary-button' : 'secondary-button'}
							onclick={advanceQuiz}
						>
							{quizChoiceIsCorrect
								? quizQuestionIndex === activeQuizScenario.questions.length - 1
									? 'Valider le quiz'
									: 'Question suivante'
								: 'Réessayer'}
						</button>
					</div>
				{/if}
			{:else if activeMiniGameScenario}
				<p class="session-lead">{activeMiniGameScenario.intro}</p>
				<p class="muted">{activeMiniGameScenario.instructions}</p>

				<div class="session-progress">
					<span>Cibles trouvées {miniHits.length}/{activeMiniGameScenario.goal}</span>
					<span>Erreurs {miniMisses.length}/{miniMaxMistakes}</span>
				</div>
				<div class="session-meter" aria-hidden="true">
					<div style={`width:${miniProgressPercent}%`}></div>
				</div>

				<div class="session-target-grid">
					{#each activeMiniGameScenario.targets as target}
						{@const isHit = miniHits.includes(target.id)}
						{@const isMiss = miniMisses.includes(target.id)}
						<button
							type="button"
							class={`session-target ${isHit ? 'hit' : ''} ${isMiss ? 'miss' : ''}`}
							onclick={() => chooseMiniTarget(target.id)}
							disabled={isHit || isMiss || miniGameCompleted || miniGameFailed}
						>
							{target.label}
						</button>
					{/each}
				</div>

				{#if miniGameCompleted}
					<div class="session-feedback success">
						<strong>{activeMiniGameScenario.successText}</strong>
						<p>Tu as identifié les bons éléments sans dépasser le seuil d’erreurs.</p>
					</div>

					<div class="session-actions">
						<button type="button" class="primary-button" onclick={completeActiveSession}>
							Valider le mini-jeu
						</button>
					</div>
				{:else if miniGameFailed}
					<div class="session-feedback warning">
						<strong>Deux erreurs détectées.</strong>
						<p>Le mini-jeu redémarre pour te laisser retenter la bonne combinaison.</p>
					</div>

					<div class="session-actions">
						<button type="button" class="secondary-button" onclick={restartMiniGame}>
							Relancer le mini-jeu
						</button>
					</div>
				{/if}
			{/if}
		</dialog>
	</div>
{/if}
