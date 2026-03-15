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
	icon: string;
	accent: string;
};

export type ReminderItem = {
	id: string;
	label: string;
	time: string;
	dayLabel: string;
	done: boolean;
};

export type JourneyCaseOption = {
	label: string;
	feedback: string;
	correct: boolean;
};

export type JourneyCaseScenario = {
	kind: 'case';
	intro: string;
	question: string;
	options: JourneyCaseOption[];
	successText: string;
};

export type JourneyQuizQuestion = {
	prompt: string;
	choices: string[];
	correctIndex: number;
	explanation: string;
};

export type JourneyQuizScenario = {
	kind: 'quiz';
	intro: string;
	questions: JourneyQuizQuestion[];
	successText: string;
};

export type JourneyMiniGameTarget = {
	id: string;
	label: string;
	correct: boolean;
};

export type JourneyMiniGameScenario = {
	kind: 'mini-jeu';
	intro: string;
	instructions: string;
	goal: number;
	targets: JourneyMiniGameTarget[];
	successText: string;
};

export type JourneyActivityScenario =
	| JourneyCaseScenario
	| JourneyQuizScenario
	| JourneyMiniGameScenario;

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
		icon: '🥼',
		accent: 'mint'
	},
	{
		id: 'accessory-cuivre',
		name: 'Stéthoscope cuivre',
		slot: 'accessory',
		price: 190,
		tag: 'Populaire',
		description: 'Accessoire brillant pour souligner le portrait.',
		icon: '🩺',
		accent: 'gold'
	},
	{
		id: 'background-jungle',
		name: 'Fond tropical',
		slot: 'background',
		price: 480,
		tag: 'Nouveau',
		description: 'Décor illustré pour la fiche avatar.',
		icon: '🌴',
		accent: 'coral'
	},
	{
		id: 'badge-surgeon',
		name: 'Badge chirurgien',
		slot: 'badge',
		price: 110,
		tag: 'Commun',
		description: 'Petit insigne de spécialiste à équiper sur le profil.',
		icon: '🏅',
		accent: 'ink'
	}
];

export const journeyActivityScenarios: Record<JourneyNode['id'], JourneyActivityScenario> = {
	'w1-1': {
		kind: 'case',
		intro: 'Un border collie arrive haletant après un choc léger sur la voie publique.',
		question: 'Quelle est la première action prioritaire ?',
		options: [
			{
				label: 'Évaluer ABC, oxygéner et prendre les constantes',
				feedback:
					"Bonne priorité : tu sécurises l'airway, la ventilation et la perfusion avant le reste.",
				correct: true
			},
			{
				label: 'Passer directement à la radiographie thoracique',
				feedback: "L'imagerie vient après la stabilisation initiale.",
				correct: false
			},
			{
				label: 'Donner à boire et attendre dix minutes',
				feedback: "Tu perds un temps précieux et tu ne traites pas l'urgence.",
				correct: false
			}
		],
		successText: 'Patient stabilisé, triage initial validé.'
	},
	'w1-2': {
		kind: 'quiz',
		intro: 'Réponds aux deux questions pour valider le triage.',
		questions: [
			{
				prompt: 'Un chien convulse encore en salle d’attente. Niveau de priorité ?',
				choices: ['Différé', 'Immédiat', 'Dans la journée'],
				correctIndex: 1,
				explanation: 'Une convulsion active est une urgence immédiate.'
			},
			{
				prompt: 'Muqueuses pâles, CRT allongé et tachycardie suggèrent surtout :',
				choices: ['Une bonne perfusion', 'Un état de choc', 'Un simple stress'],
				correctIndex: 1,
				explanation: 'Ce trio est typique d’une hypoperfusion à traiter vite.'
			}
		],
		successText: 'Quiz triage validé sans erreur critique.'
	},
	'w1-3': {
		kind: 'mini-jeu',
		intro: 'Repère rapidement les incidences utiles avant la fin du chrono.',
		instructions: 'Trouve 3 incidences thoraciques correctes. Deux erreurs maximum.',
		goal: 3,
		targets: [
			{ id: 'lat-droite', label: 'Latérale droite', correct: true },
			{ id: 'vd', label: 'Vue VD', correct: true },
			{ id: 'lat-gauche', label: 'Latérale gauche', correct: true },
			{ id: 'oblique-bassin', label: 'Oblique bassin', correct: false },
			{ id: 'membres', label: 'Incidence membres', correct: false },
			{ id: 'dentaire', label: 'Vue dentaire', correct: false }
		],
		successText: 'Incidences repérées, série thoracique prête.'
	},
	'w2-1': {
		kind: 'quiz',
		intro: 'Calcule juste pour éviter tout sous-dosage ou surdosage.',
		questions: [
			{
				prompt: 'Pour un chien de 20 kg à 0,2 mg/kg, la dose totale est :',
				choices: ['2 mg', '4 mg', '8 mg'],
				correctIndex: 1,
				explanation: '20 × 0,2 = 4 mg.'
			},
			{
				prompt: 'Tu dois toujours vérifier ensuite :',
				choices: [
					'La concentration disponible',
					'La couleur du flacon seulement',
					'Le prix unitaire'
				],
				correctIndex: 0,
				explanation: 'La concentration finale conditionne le volume à administrer.'
			}
		],
		successText: 'Posologie sécurisée et vérifiée.'
	},
	'w2-2': {
		kind: 'case',
		intro: 'Un chien senior en léger surpoids vient en consultation nutrition.',
		question: 'Quelle stratégie proposes-tu en premier ?',
		options: [
			{
				label: 'Réévaluer l’état corporel puis ajuster la ration progressivement',
				feedback: 'Bonne approche : objectif réaliste, suivi mesurable et meilleure observance.',
				correct: true
			},
			{
				label: 'Diviser la ration par deux dès ce soir',
				feedback: 'Trop brutal : risque de mauvaise observance et d’erreurs de conduite.',
				correct: false
			},
			{
				label: 'Supprimer toute activité physique pendant un mois',
				feedback: "L'activité contrôlée fait partie du plan de prise en charge.",
				correct: false
			}
		],
		successText: 'Plan nutritionnel posé avec progressivité.'
	},
	'w2-3': {
		kind: 'mini-jeu',
		intro: 'Assemble un protocole cohérent avant validation.',
		instructions: 'Trouve 3 éléments compatibles. Deux erreurs maximum.',
		goal: 3,
		targets: [
			{ id: 'analgesie', label: 'Analgésie adaptée', correct: true },
			{ id: 'posologie', label: 'Dose vérifiée', correct: true },
			{ id: 'contre-indications', label: 'Contre-indications relues', correct: true },
			{ id: 'double-antibio', label: 'Double antibiotique au hasard', correct: false },
			{ id: 'dose-estimee', label: 'Dose estimée à vue', correct: false },
			{ id: 'ordonnance-vide', label: 'Ordonnance incomplète', correct: false }
		],
		successText: 'Protocole validé et cohérent.'
	},
	'w3-1': {
		kind: 'case',
		intro: 'L’échographie abdominale montre plusieurs structures difficiles à identifier.',
		question: 'Quel réflexe clinique est le plus solide ?',
		options: [
			{
				label: 'Revenir aux repères anatomiques et balayer méthodiquement',
				feedback: 'Exact : méthode et repères évitent la surinterprétation.',
				correct: true
			},
			{
				label: 'Conclure immédiatement à une masse sans autre vue',
				feedback: 'Conclusion trop rapide sans recoupement d’images.',
				correct: false
			},
			{
				label: 'Changer de patient pour revenir plus tard',
				feedback: 'Tu perds l’information et ne résous pas le doute diagnostique.',
				correct: false
			}
		],
		successText: 'Balayage abdominal propre et fiable.'
	},
	'w3-2': {
		kind: 'quiz',
		intro: 'Valide les bons réflexes de ration thérapeutique.',
		questions: [
			{
				prompt: 'Dans une ration thérapeutique, on ajuste en priorité :',
				choices: ['Les besoins du patient', 'Le goût du propriétaire', 'Le packaging choisi'],
				correctIndex: 0,
				explanation: 'Le plan se construit d’abord autour du besoin clinique du chien.'
			},
			{
				prompt: 'Pour suivre une transition alimentaire, le bon réflexe est :',
				choices: [
					'Changer tout d’un coup',
					'Étaler la transition sur plusieurs jours',
					'Ne jamais réévaluer'
				],
				correctIndex: 1,
				explanation: 'Une transition progressive limite les troubles digestifs.'
			}
		],
		successText: 'Quiz alimentation validé.'
	},
	'w3-3': {
		kind: 'case',
		intro: 'Cas final de garde : urgence, imagerie et dosage doivent s’enchaîner sans faute.',
		question: 'Quelle décision montre la meilleure coordination ?',
		options: [
			{
				label: 'Stabiliser, imager selon indication puis confirmer la dose avant traitement',
				feedback:
					'Très bon enchaînement : priorité vitale, confirmation diagnostique puis traitement sécurisé.',
				correct: true
			},
			{
				label: 'Traiter à l’aveugle puis revoir le dossier après',
				feedback: 'Trop risqué pour un cas de garde à embranchements.',
				correct: false
			},
			{
				label: 'Attendre tous les avis avant toute action',
				feedback: 'Tu retardes une prise en charge qui doit rester dynamique.',
				correct: false
			}
		],
		successText: 'Boss de garde réussi, parcours maîtrisé.'
	}
};

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
