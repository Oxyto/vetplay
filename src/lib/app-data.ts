export type DomainId = 'urgences' | 'imagerie' | 'pharmacologie' | 'nutrition';
export type ActivityKind = 'case' | 'quiz' | 'mini-jeu';
export type NodeLane = 'left' | 'center' | 'right';
export type CosmeticSlot = 'outfit' | 'accessory' | 'background' | 'badge';

export type JourneyNode = {
	id: string;
	world: number;
	stage: number;
	lane: NodeLane;
	title: string;
	description: string;
	domain: DomainId;
	kind: ActivityKind;
	duration: string;
	xp: number;
	coins: number;
	accent: 'mint' | 'gold' | 'coral' | 'ink';
};

export type DomainActivity = {
	id: string;
	title: string;
	description: string;
	kind: ActivityKind;
	xp: number;
	coins: number;
	domain: DomainId;
};

export type DomainDefinition = {
	id: DomainId;
	name: string;
	description: string;
	goal: string;
	activities: DomainActivity[];
};

export type CosmeticItem = {
	id: string;
	name: string;
	slot: CosmeticSlot;
	price: number;
	tag: string;
	description: string;
	accent: string;
};

export type ReminderItem = {
	id: string;
	label: string;
	time: string;
	dayLabel: string;
	done: boolean;
};

export type VaccinePreset = {
	id: string;
	label: string;
	time: string;
	dayLabel: string;
	detail: string;
};

export const journeyNodes: JourneyNode[] = [
	{
		id: 'w1-1',
		world: 1,
		stage: 1,
		lane: 'left',
		title: 'Accueil du patient',
		description: 'Stabilise un chien arrivé en urgence et priorise les constantes vitales.',
		domain: 'urgences',
		kind: 'case',
		duration: '4 min',
		xp: 50,
		coins: 18,
		accent: 'mint'
	},
	{
		id: 'w1-2',
		world: 1,
		stage: 2,
		lane: 'right',
		title: 'Quiz triage',
		description: 'Choisis la bonne priorisation sur 8 cas cliniques très courts.',
		domain: 'urgences',
		kind: 'quiz',
		duration: '3 min',
		xp: 36,
		coins: 12,
		accent: 'gold'
	},
	{
		id: 'w1-3',
		world: 1,
		stage: 3,
		lane: 'center',
		title: 'Radio sprint',
		description: 'Repère les bonnes incidences thoraciques avant la fin du chrono.',
		domain: 'imagerie',
		kind: 'mini-jeu',
		duration: '3 min',
		xp: 44,
		coins: 14,
		accent: 'coral'
	},
	{
		id: 'w2-1',
		world: 2,
		stage: 1,
		lane: 'right',
		title: 'Dose express',
		description: 'Calcule une dose d’analgésie sans erreur de conversion.',
		domain: 'pharmacologie',
		kind: 'quiz',
		duration: '4 min',
		xp: 52,
		coins: 16,
		accent: 'gold'
	},
	{
		id: 'w2-2',
		world: 2,
		stage: 2,
		lane: 'left',
		title: 'Consult nutrition',
		description: 'Ajuste la ration d’un chien senior selon son état corporel.',
		domain: 'nutrition',
		kind: 'case',
		duration: '5 min',
		xp: 58,
		coins: 18,
		accent: 'mint'
	},
	{
		id: 'w2-3',
		world: 2,
		stage: 3,
		lane: 'right',
		title: 'Ordonnancier combo',
		description: 'Assemble le bon protocole en glissant les molécules compatibles.',
		domain: 'pharmacologie',
		kind: 'mini-jeu',
		duration: '4 min',
		xp: 64,
		coins: 20,
		accent: 'coral'
	},
	{
		id: 'w3-1',
		world: 3,
		stage: 1,
		lane: 'left',
		title: 'Scan abdominal',
		description: 'Localise trois structures clés et élimine les faux positifs.',
		domain: 'imagerie',
		kind: 'case',
		duration: '5 min',
		xp: 70,
		coins: 22,
		accent: 'mint'
	},
	{
		id: 'w3-2',
		world: 3,
		stage: 2,
		lane: 'center',
		title: 'Quiz alimentation',
		description: 'Réponds à une série de rations thérapeutiques chronométrées.',
		domain: 'nutrition',
		kind: 'quiz',
		duration: '3 min',
		xp: 46,
		coins: 15,
		accent: 'gold'
	},
	{
		id: 'w3-3',
		world: 3,
		stage: 3,
		lane: 'right',
		title: 'Boss de garde',
		description: 'Combine urgences, imagerie et dosage dans un cas final à embranchements.',
		domain: 'urgences',
		kind: 'case',
		duration: '7 min',
		xp: 90,
		coins: 30,
		accent: 'ink'
	}
];

export const domainCatalog: DomainDefinition[] = [
	{
		id: 'urgences',
		name: 'Urgences',
		description: 'Décision rapide, triage et stabilisation initiale.',
		goal: 'Tenir la garde sans perdre le fil des priorités.',
		activities: [
			{
				id: 'urgences-triage',
				title: 'Triage flash',
				description: 'Classer 6 patients par gravité.',
				kind: 'case',
				xp: 34,
				coins: 9,
				domain: 'urgences'
			},
			{
				id: 'urgences-abc',
				title: 'ABC en 90 secondes',
				description: 'Valider l’ordre de prise en charge primaire.',
				kind: 'quiz',
				xp: 28,
				coins: 8,
				domain: 'urgences'
			},
			{
				id: 'urgences-shock',
				title: 'Chariot de choc',
				description: 'Mini-jeu de préparation de matériel.',
				kind: 'mini-jeu',
				xp: 30,
				coins: 10,
				domain: 'urgences'
			}
		]
	},
	{
		id: 'imagerie',
		name: 'Imagerie',
		description: 'Lecture d’images, incidences et repérage anatomique.',
		goal: 'Lire vite, juste et sans surinterpréter.',
		activities: [
			{
				id: 'imagerie-thorax',
				title: 'Thorax express',
				description: 'Retrouver l’incidence correcte avant le chrono.',
				kind: 'mini-jeu',
				xp: 26,
				coins: 8,
				domain: 'imagerie'
			},
			{
				id: 'imagerie-label',
				title: 'Repérage anatomique',
				description: 'Placer les bons repères sur une radio.',
				kind: 'case',
				xp: 32,
				coins: 9,
				domain: 'imagerie'
			},
			{
				id: 'imagerie-artifacts',
				title: 'Artefacts ou lésions',
				description: 'Différencier les pièges d’interprétation.',
				kind: 'quiz',
				xp: 29,
				coins: 9,
				domain: 'imagerie'
			}
		]
	},
	{
		id: 'pharmacologie',
		name: 'Pharmacologie',
		description: 'Calculs de dose, compatibilités et ordonnances.',
		goal: 'Sécuriser les prescriptions du premier coup.',
		activities: [
			{
				id: 'pharma-doses',
				title: 'Calcul de dose',
				description: 'Convertir les mg/kg sans se tromper.',
				kind: 'quiz',
				xp: 35,
				coins: 10,
				domain: 'pharmacologie'
			},
			{
				id: 'pharma-ordonnance',
				title: 'Ordonnance claire',
				description: 'Assembler une prescription complète.',
				kind: 'case',
				xp: 31,
				coins: 9,
				domain: 'pharmacologie'
			},
			{
				id: 'pharma-mix',
				title: 'Compatibilités',
				description: 'Identifier les mélanges à éviter.',
				kind: 'mini-jeu',
				xp: 30,
				coins: 8,
				domain: 'pharmacologie'
			}
		]
	},
	{
		id: 'nutrition',
		name: 'Nutrition',
		description: 'Rations, suivi patient et conseils propriétaires.',
		goal: 'Personnaliser les recommandations sans surcharger la consultation.',
		activities: [
			{
				id: 'nutrition-ration',
				title: 'Ration thérapeutique',
				description: 'Choisir le bon plan alimentaire selon le cas.',
				kind: 'case',
				xp: 32,
				coins: 9,
				domain: 'nutrition'
			},
			{
				id: 'nutrition-bcs',
				title: 'Body condition score',
				description: 'Évaluer le score corporel à partir d’indices visuels.',
				kind: 'quiz',
				xp: 27,
				coins: 8,
				domain: 'nutrition'
			},
			{
				id: 'nutrition-owner',
				title: 'Dialogue propriétaire',
				description: 'Mini-jeu de réponses adaptées et engageantes.',
				kind: 'mini-jeu',
				xp: 28,
				coins: 9,
				domain: 'nutrition'
			}
		]
	}
];

export const cosmeticCatalog: CosmeticItem[] = [
	{
		id: 'outfit-sauge',
		name: 'Blouse sauge',
		slot: 'outfit',
		price: 320,
		tag: 'Rare',
		description: 'Blouse brodée pour un look clinique premium.',
		accent: 'mint'
	},
	{
		id: 'accessory-cuivre',
		name: 'Stéthoscope cuivre',
		slot: 'accessory',
		price: 190,
		tag: 'Populaire',
		description: 'Accessoire brillant pour souligner le portrait.',
		accent: 'gold'
	},
	{
		id: 'background-jungle',
		name: 'Fond tropical',
		slot: 'background',
		price: 480,
		tag: 'Nouveau',
		description: 'Décor illustré pour la fiche avatar.',
		accent: 'coral'
	},
	{
		id: 'badge-surgeon',
		name: 'Badge chirurgien',
		slot: 'badge',
		price: 110,
		tag: 'Commun',
		description: 'Petit insigne de spécialiste à équiper sur le profil.',
		accent: 'ink'
	}
];

export const avatarStyles = [
	{
		id: 'heroic',
		label: 'Héroïque',
		prompt: 'heroic veterinary explorer, polished game avatar, adventurous but soft'
	},
	{
		id: 'clinical',
		label: 'Clinique',
		prompt: 'clean veterinary portrait, modern clinic, realistic fur and calm pose'
	},
	{
		id: 'playful',
		label: 'Joueur',
		prompt: 'stylized playful mascot, warm smile, colorful and friendly'
	}
];

export const notificationLabels = {
	dailyJourney: 'Rappel vaccin du jour',
	unlockedActivities: 'Alertes rappel annuel',
	shopDrops: 'Campagnes vaccinales saisonnières',
	eveningDigest: 'Résumé des vaccins à venir'
} as const;

export const defaultReminders: ReminderItem[] = [
	{
		id: 'rem-1',
		label: 'Rappel CHPPi annuel - Nox',
		time: '08:30',
		dayLabel: 'Aujourd’hui',
		done: false
	},
	{
		id: 'rem-2',
		label: 'Vaccin rage - Mila',
		time: '13:15',
		dayLabel: 'Aujourd’hui',
		done: false
	},
	{
		id: 'rem-3',
		label: 'Leptospirose booster - Rio',
		time: '09:00',
		dayLabel: 'Demain',
		done: false
	}
];

export const vaccinePresets: VaccinePreset[] = [
	{
		id: 'preset-chppi',
		label: 'Rappel CHPPi annuel',
		time: '08:30',
		dayLabel: 'Aujourd’hui',
		detail: 'Booster classique chien adulte'
	},
	{
		id: 'preset-rage',
		label: 'Vaccin rage',
		time: '12:15',
		dayLabel: 'Cette semaine',
		detail: 'Départ à l’étranger ou mise à jour légale'
	},
	{
		id: 'preset-lepto',
		label: 'Leptospirose booster',
		time: '17:45',
		dayLabel: 'Demain',
		detail: 'Rappel saison humide'
	}
];

export const domainNames: Record<DomainId, string> = Object.fromEntries(
	domainCatalog.map((domain) => [domain.id, domain.name])
) as Record<DomainId, string>;

export const totalJourneyXp = journeyNodes.reduce((total, node) => total + node.xp, 0);
