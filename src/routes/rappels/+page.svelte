<script lang="ts">
	import { fromStore } from 'svelte/store';
	import { notificationLabels, vaccinePresets } from '$lib/app-data';
	import { vetplay, type NotificationSettingId } from '$lib/stores/vetplay';

	const app = fromStore(vetplay);
	const notificationEntries = Object.entries(notificationLabels) as [
		NotificationSettingId,
		string
	][];

	let label = $state('');
	let time = $state('08:00');
	let dayLabel = $state("Aujourd'hui");

	function addReminder() {
		if (!label.trim()) return;
		vetplay.addReminder({ label, time, dayLabel, done: false });
		label = '';
		time = '08:00';
		dayLabel = "Aujourd'hui";
	}

	function applyPreset(presetId: string) {
		const preset = vaccinePresets.find((entry) => entry.id === presetId);
		if (!preset) return;
		label = preset.label;
		time = preset.time;
		dayLabel = preset.dayLabel;
	}
</script>

<section class="hero-card compact motion-rise delay-1">
	<div>
		<p class="section-kicker">Vaccination</p>
		<h2>Planifie les vaccins à faire sans perdre les échéances.</h2>
		<p class="muted">
			La page sert à suivre les rappels vaccinaux des animaux, programmer les boosters et garder une
			alerte claire sur les prochaines injections.
		</p>
	</div>

	<div class="hero-stats">
		<div>
			<strong>{app.current.reminders.length}</strong>
			<span>vaccins planifiés</span>
		</div>
		<div>
			<strong>
				{Object.values(app.current.notificationSettings).filter(Boolean).length}
			</strong>
			<span>alertes actives</span>
		</div>
	</div>
</section>

<section class="section-block motion-rise delay-2">
	<div class="section-head">
		<div>
			<p class="section-kicker">Presets vaccin</p>
			<h3>Ajouter en 1 tap</h3>
		</div>
	</div>

	<div class="preset-grid">
		{#each vaccinePresets as preset}
			<button type="button" class="preset-card" onclick={() => applyPreset(preset.id)}>
				<strong>{preset.label}</strong>
				<p>{preset.detail}</p>
				<span>{preset.dayLabel} · {preset.time}</span>
			</button>
		{/each}
	</div>
</section>

<section class="section-block motion-rise delay-3">
	<div class="section-head">
		<div>
			<p class="section-kicker">Ajouter</p>
			<h3>Nouveau rappel vaccinal</h3>
		</div>
	</div>

	<form
		class="panel-card form-card"
		onsubmit={(event) => {
			event.preventDefault();
			addReminder();
		}}
	>
		<label class="field">
			<span>Vaccin / rappel</span>
			<input bind:value={label} placeholder="Ex: Rappel CHPPi annuel - Nox" />
		</label>

		<div class="form-inline">
			<label class="field">
				<span>Heure</span>
				<input bind:value={time} type="time" />
			</label>

			<label class="field">
				<span>Jour</span>
				<select bind:value={dayLabel}>
					<option>Aujourd'hui</option>
					<option>Demain</option>
					<option>Cette semaine</option>
				</select>
			</label>
		</div>

		<button type="submit" class="primary-button">Ajouter le vaccin</button>
	</form>
</section>

<section class="section-block motion-rise delay-4">
	<div class="section-head">
		<div>
			<p class="section-kicker">Planning vaccinal</p>
			<h3>Vaccins enregistrés</h3>
		</div>
	</div>

	<div class="timeline-list">
		{#each app.current.reminders as reminder}
			<article class={`timeline-item ${reminder.done ? 'timeline-item-done' : ''}`}>
				<div class="time-badge">{reminder.time}</div>
				<div class="timeline-copy">
					<div class="timeline-copy-head">
						<h5>{reminder.label}</h5>
						<span>{reminder.dayLabel}</span>
					</div>
					<div class="timeline-actions">
						<button
							type="button"
							class="secondary-button"
							onclick={() => vetplay.toggleReminderDone(reminder.id)}
						>
							{reminder.done ? 'Réactiver' : 'Vaccin fait'}
						</button>
						<button
							type="button"
							class="ghost-button"
							onclick={() => vetplay.removeReminder(reminder.id)}
						>
							Supprimer
						</button>
					</div>
				</div>
			</article>
		{/each}
	</div>
</section>

<section class="section-block motion-rise delay-5">
	<div class="section-head">
		<div>
			<p class="section-kicker">Notifications</p>
			<h3>Préférences vaccinales</h3>
		</div>
	</div>

	<div class="settings-list">
		{#each notificationEntries as [settingId, settingLabel]}
			<div class="setting-row">
				<div class="setting-copy">
					<h4>{settingLabel}</h4>
					<p>
						{app.current.notificationSettings[settingId]
							? 'Actif dans le flux utilisateur.'
							: 'Mis en pause pour éviter les interruptions.'}
					</p>
				</div>
				<button
					class:enabled={app.current.notificationSettings[settingId]}
					aria-pressed={app.current.notificationSettings[settingId]}
					aria-label={settingLabel}
					class="toggle"
					type="button"
					onclick={() => vetplay.toggleNotification(settingId)}
				>
					<span></span>
				</button>
			</div>
		{/each}
	</div>
</section>
