<script lang="ts">
	import { fromStore } from 'svelte/store';
	import { avatarStyles, cosmeticCatalog } from '$lib/app-data';
	import {
		dogPhotoAcceptValue,
		geminiAvatarEnabled,
		generateGeminiAvatarFromPhoto,
		isAcceptedDogPhotoFile,
		prepareDogPhotoFile
	} from '$lib/gemini-avatar';
	import {
		getEquippedCosmetics,
		getPlayerLevel,
		getTotalActivityRuns,
		getTotalCompletedNodes,
		vetplay
	} from '$lib/stores/vetplay';

	const app = fromStore(vetplay);
	const equippedCosmetics = $derived(getEquippedCosmetics(app.current));

	let playerName = $state(app.current.playerName);
	let dogName = $state(app.current.dogName);
	let styleId = $state(app.current.avatarStyleId);
	let selectedFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let preparingFile = $state(false);
	let generating = $state(false);
	let generationError = $state<string | null>(null);
	let generationNotice = $state<string | null>(null);
	let fileInput: HTMLInputElement | null = null;

	function syncProfileFields() {
		playerName = app.current.playerName;
		dogName = app.current.dogName;
		styleId = app.current.avatarStyleId;
	}

	$effect(() => {
		syncProfileFields();
	});

	$effect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	});

	function clearSelectedFile() {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			previewUrl = null;
		}

		selectedFile = null;
		preparingFile = false;
		generationError = null;
		generationNotice = null;

		if (fileInput) {
			fileInput.value = '';
		}
	}

	function openFilePicker() {
		fileInput?.click();
	}

	async function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;

		if (!file) {
			clearSelectedFile();
			return;
		}

		if (!isAcceptedDogPhotoFile(file)) {
			clearSelectedFile();
			generationError = 'Formats acceptés : PNG, JPG, JPEG, WebP, HEIC ou HEIF.';
			return;
		}

		clearSelectedFile();
		preparingFile = true;

		try {
			const normalizedFile = await prepareDogPhotoFile(file);
			selectedFile = normalizedFile;
			previewUrl = URL.createObjectURL(normalizedFile);

			if (normalizedFile !== file) {
				generationNotice = 'Photo convertie automatiquement pour une lecture mobile plus fiable.';
			}
		} catch (error) {
			clearSelectedFile();
			generationError =
				error instanceof Error
					? error.message
					: "La photo n'a pas pu être préparée pour la génération.";
		} finally {
			preparingFile = false;
		}
	}

	async function saveProfile() {
		vetplay.updateProfile(playerName, dogName, styleId);
	}

	async function generateAvatar(event: SubmitEvent) {
		event.preventDefault();
		generationError = null;
		generationNotice = null;
		await saveProfile();

		if (!selectedFile) {
			generationError = 'Ajoute une photo de chien avant de lancer la génération.';
			return;
		}

		if (!geminiAvatarEnabled) {
			generationError =
				'Ajoute une valeur à PUBLIC_GEMINI_API_KEY dans .env pour activer la génération IA.';
			return;
		}

		generating = true;

		try {
			const geminiResult = await generateGeminiAvatarFromPhoto({
				file: selectedFile,
				styleId,
				dogName,
				equippedCount: equippedCosmetics.length,
				sourceUrl: previewUrl ?? undefined
			});

			generationNotice = 'Avatar généré avec Gemini à partir de la photo canine.';
			vetplay.setAvatarResult(
				geminiResult.imageDataUrl,
				geminiResult.prompt,
				geminiResult.breedGuess,
				geminiResult.provider
			);
		} catch (error) {
			generationError = error instanceof Error ? error.message : 'La génération a échoué.';
		} finally {
			generating = false;
		}
	}

	const avatarTitle = $derived(app.current.dogName || 'Avatar vétérinaire');
	const avatarProviderLabel = $derived(
		app.current.avatarProvider === 'gemini' ? 'Gemini Vision + Image' : null
	);
	const totalBadges = $derived(
		cosmeticCatalog.filter((item) => app.current.ownedCosmeticIds.includes(item.id)).length
	);
</script>

<section class="profile-hero motion-rise delay-1">
	<div class="avatar-panel">
		<div class:has-avatar={Boolean(app.current.avatarImage)} class="avatar-image">
			<div class="avatar-glow"></div>
			{#if app.current.avatarImage}
				<img src={app.current.avatarImage} alt={`Avatar de ${avatarTitle}`} class="avatar-render" />
			{:else}
				<div class="avatar-placeholder">
					<span>Avatar canin animé</span>
					<strong>{avatarTitle}</strong>
				</div>
			{/if}

			<div class="avatar-dog">
				<span>Portrait joueur</span>
				<strong>{avatarTitle}</strong>
				<p>Lv {getPlayerLevel(app.current.xp)} · {app.current.playerName}</p>
			</div>
		</div>

		<div class="avatar-actions">
			<button type="button" class="primary-button" onclick={saveProfile}
				>Mettre à jour le profil</button
			>
			<a href="/boutique" class="secondary-button">Voir la boutique</a>
		</div>
	</div>

	<form class="panel-card form-card" onsubmit={generateAvatar}>
		<p class="section-kicker">Canin uniquement</p>
		<h3>Générer un avatar animé</h3>
		<p class="muted">
			Gemini transforme une photo de chien en portrait 3D stylisé, avec proportions canines
			réalistes et palette simplifiée. Utilise de préférence une photo nette de tête ou de buste.
		</p>
		<p class="helper-copy">
			{#if geminiAvatarEnabled}
				Gemini analyse la race probable puis régénère un avatar canin type film d'animation.
			{:else}
				Renseigne `PUBLIC_GEMINI_API_KEY` dans `.env` pour activer la génération IA sur mobile.
			{/if}
		</p>

		<label class="field">
			<span>Nom du joueur</span>
			<input bind:value={playerName} placeholder="Nom du soignant" />
		</label>

		<label class="field">
			<span>Nom du chien</span>
			<input bind:value={dogName} placeholder="Nom du chien" />
		</label>

		<label class="field">
			<span>Style visuel</span>
			<select bind:value={styleId}>
				{#each avatarStyles as style}
					<option value={style.id}>{style.label}</option>
				{/each}
			</select>
		</label>

		<div class="field field-file">
			<span>Photo du chien</span>
			<input
				bind:this={fileInput}
				accept={dogPhotoAcceptValue}
				class="sr-only-input"
				type="file"
				onchange={handleFileChange}
			/>

			<div class="file-picker">
				<div class="file-picker-copy">
					<strong>
						{selectedFile
							? 'Photo canine sélectionnée'
							: preparingFile
								? 'Préparation de la photo...'
								: 'Importer une photo canine'}
					</strong>
					<p>
						{selectedFile
							? selectedFile.name
							: 'PNG, JPG, JPEG, WebP, HEIC ou HEIF. Cadrage tête ou buste recommandé.'}
					</p>
				</div>

				<div class="wrap-actions">
					<button
						type="button"
						class="secondary-button"
						onclick={openFilePicker}
						disabled={preparingFile || generating}
					>
						{preparingFile
							? 'Préparation...'
							: selectedFile
								? 'Changer la photo'
								: 'Sélectionner un fichier'}
					</button>

					{#if selectedFile}
						<button
							type="button"
							class="ghost-button"
							onclick={clearSelectedFile}
							disabled={preparingFile || generating}
						>
							Retirer
						</button>
					{/if}
				</div>
			</div>
		</div>

		{#if previewUrl}
			<div class="upload-preview">
				<img src={previewUrl} alt="Chien avant génération d’avatar" />
			</div>
		{/if}

		{#if generationError}
			<p class="error-banner">{generationError}</p>
		{/if}

		{#if generationNotice}
			<p class="info-banner">{generationNotice}</p>
		{/if}

		{#if app.current.avatarBreedGuess || app.current.lastAvatarPrompt}
			<div class="analysis-card">
				<div class="analysis-meta">
					{#if avatarProviderLabel}
						<span class="analysis-pill">{avatarProviderLabel}</span>
					{/if}
					{#if app.current.avatarBreedGuess}
						<span class="analysis-pill analysis-pill-soft">
							Race estimée : {app.current.avatarBreedGuess}
						</span>
					{/if}
				</div>

				{#if app.current.lastAvatarPrompt}
					<p>{app.current.lastAvatarPrompt}</p>
				{/if}
			</div>
		{/if}

		<div class="avatar-actions">
			<button
				type="submit"
				class="primary-button"
				disabled={generating || preparingFile || !selectedFile || !geminiAvatarEnabled}
			>
				{generating
					? 'Génération en cours...'
					: preparingFile
						? 'Préparation de la photo...'
						: 'Générer avec Gemini'}
			</button>
			<button type="button" class="secondary-button" onclick={saveProfile}
				>Mettre à jour le profil</button
			>
		</div>

		<div class="upload-steps">
			<span>1. Sélection canine</span>
			<span>2. Analyse de race</span>
			<span>3. Avatar 3D stylisé</span>
		</div>
	</form>
</section>

<section class="section-block motion-rise delay-2">
	<div class="section-head">
		<div>
			<p class="section-kicker">Statistiques</p>
			<h3>Profil du joueur</h3>
		</div>
	</div>

	<div class="stats-grid">
		<article class="stat-card">
			<span>XP totale</span>
			<strong>{app.current.xp}</strong>
		</article>
		<article class="stat-card">
			<span>Cases terminées</span>
			<strong>{getTotalCompletedNodes(app.current)}</strong>
		</article>
		<article class="stat-card">
			<span>Activités jouées</span>
			<strong>{getTotalActivityRuns(app.current)}</strong>
		</article>
		<article class="stat-card">
			<span>Cosmétiques</span>
			<strong>{totalBadges}</strong>
		</article>
	</div>

	<div class="activity-tags">
		{#if equippedCosmetics.length > 0}
			{#each equippedCosmetics as item}
				<span>{item.name}</span>
			{/each}
		{:else}
			<span>Aucun cosmétique équipé</span>
		{/if}
	</div>
</section>
