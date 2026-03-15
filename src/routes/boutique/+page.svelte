<script lang="ts">
	import { fromStore } from 'svelte/store';
	import { cosmeticCatalog } from '$lib/app-data';
	import { getEquippedCosmetics, getOwnedCosmeticSet, vetplay } from '$lib/stores/vetplay';

	const app = fromStore(vetplay);
	const ownedCosmetics = $derived(getOwnedCosmeticSet(app.current));
	const equippedCosmetics = $derived(getEquippedCosmetics(app.current));

	const slotLabels = {
		outfit: 'Tenue',
		accessory: 'Accessoire',
		background: 'Fond',
		badge: 'Badge'
	} as const;
</script>

<section class="hero-card compact">
	<div>
		<p class="section-kicker">Cosmétiques</p>
		<h2>La boutique est maintenant achetable et équipable.</h2>
		<p class="muted">
			Chaque objet acheté consomme les VetCoins gagnés en jeu puis s’équipe instantanément sur le
			profil si tu le souhaites.
		</p>
	</div>

	<div class="wallet-card">
		<span>VetCoins</span>
		<strong>{app.current.coins}</strong>
	</div>
</section>

<section class="section-block">
	<div class="section-head">
		<div>
			<p class="section-kicker">Équipement</p>
			<h3>Actuellement équipé</h3>
		</div>
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

<section class="section-block">
	<div class="section-head">
		<div>
			<p class="section-kicker">Catalogue</p>
			<h3>Sélection du moment</h3>
		</div>
	</div>

	<div class="shop-grid">
		{#each cosmeticCatalog as item}
			{@const isOwned = ownedCosmetics.has(item.id)}
			{@const isEquipped = app.current.equippedCosmetics[item.slot] === item.id}
			<article class={`shop-card accent-${item.accent}`}>
				<div class={`shop-visual shop-visual-${item.accent}`}>
					<span class="shop-visual-icon" aria-hidden="true">{item.icon}</span>
					<span class="shop-visual-slot">{slotLabels[item.slot]}</span>
				</div>
				<div class="shop-copy">
					<div class="shop-topline">
						<h4>{item.name}</h4>
						<span class="pill-label">{item.tag}</span>
					</div>
					<p>{item.description}</p>
					<div class="shop-footer wrap-actions">
						<strong>{item.price} VC</strong>
						{#if !isOwned}
							<button
								type="button"
								class="primary-button"
								disabled={app.current.coins < item.price}
								onclick={() => vetplay.buyCosmetic(item.id)}
							>
								{app.current.coins < item.price ? 'Pas assez de coins' : 'Acheter'}
							</button>
						{:else}
							<button
								type="button"
								class={isEquipped ? 'secondary-button' : 'primary-button'}
								onclick={() => vetplay.equipCosmetic(item.id)}
							>
								{isEquipped ? 'Équipé' : 'Équiper'}
							</button>
						{/if}
					</div>
				</div>
			</article>
		{/each}
	</div>
</section>
