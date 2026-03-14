<script lang="ts">
	import { fromStore } from 'svelte/store';
	import { avatarStyles, cosmeticCatalog } from '$lib/app-data';
	import { stylizeAvatarFromPhoto } from '$lib/avatar-stylizer';
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
	let generating = $state(false);
	let generationError = $state<string | null>(null);
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
		generationError = null;

		if (fileInput) {
			fileInput.value = '';
		}
	}

	function openFilePicker() {
		fileInput?.click();
	}

	function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;

		if (!file) {
			clearSelectedFile();
			return;
		}

		if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
			clearSelectedFile();
			generationError = 'Formats acceptes: PNG, JPG ou WebP.';
			return;
		}

		clearSelectedFile();
		selectedFile = file;
		previewUrl = URL.createObjectURL(file);
	}

	async function saveProfile() {
		vetplay.updateProfile(playerName, dogName, styleId);
	}

	async function generateAvatar(event: SubmitEvent) {
		event.preventDefault();
		generationError = null;
		await saveProfile();

		if (!selectedFile) {
			generationError = 'Ajoute une photo de chien avant de lancer la génération.';
			return;
		}

		generating = true;

		try {
			const result = await stylizeAvatarFromPhoto({
				file: selectedFile,
				styleId,
				dogName,
				equippedCount: equippedCosmetics.length
			});
			vetplay.setAvatarResult(result.imageDataUrl, result.prompt);
		} catch (error) {
			generationError = error instanceof Error ? error.message : 'La génération a échoué.';
		} finally {
			generating = false;
		}
	}

	const avatarTitle = $derived(app.current.dogName || 'Avatar vétérinaire');
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
					<span>Avatar canin anime</span>
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
		<h3>Generer un avatar anime</h3>
		<p class="muted">
			Le generateur transforme une photo de chien en portrait anime stylise, avec proportions
			realistes et palette simplifiee. Utilise de preference une photo nette de tete ou de buste.
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
				accept="image/png,image/jpeg,image/webp"
				class="sr-only-input"
				type="file"
				onchange={handleFileChange}
			/>

			<div class="file-picker">
				<div class="file-picker-copy">
					<strong>
						{selectedFile ? 'Photo canine selectionnee' : 'Importer une photo canine'}
					</strong>
					<p>
						{selectedFile
							? selectedFile.name
							: 'PNG, JPG ou WebP. Cadrage tete ou buste recommande.'}
					</p>
				</div>

				<div class="wrap-actions">
					<button type="button" class="secondary-button" onclick={openFilePicker}>
						{selectedFile ? 'Changer la photo' : 'Selectionner un fichier'}
					</button>

					{#if selectedFile}
						<button type="button" class="ghost-button" onclick={clearSelectedFile}>
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

		<div class="avatar-actions">
			<button type="submit" class="primary-button" disabled={generating || !selectedFile}>
				{generating ? 'Génération en cours...' : "Générer l'avatar"}
			</button>
			<button type="button" class="secondary-button" onclick={saveProfile}
				>Mettre a jour le profil</button
			>
		</div>

		<div class="upload-steps">
			<span>1. Selection canine</span>
			<span>2. Palette simplifiee</span>
			<span>3. Avatar anime</span>
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
