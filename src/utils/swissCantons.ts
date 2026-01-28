/**
 * Mapping des villes suisses par canton
 * Utilisé pour regrouper les formations par canton dans le filtre de recherche
 *
 * Note: Ce mapping est utilisé côté client uniquement.
 * Les villes sont en français (ou bilingue quand applicable).
 */

export interface CantonConfig {
  id: string;
  label: string;
  /** Villes appartenant à ce canton (en minuscules pour le matching) */
  cities: string[];
}

/**
 * Liste des cantons suisses avec leurs villes principales
 * Les villes sont en minuscules pour faciliter le matching insensible à la casse
 */
export const SWISS_CANTONS: CantonConfig[] = [
  // Suisse romande
  {
    id: 'GE',
    label: 'Genève',
    cities: ['genève', 'geneva', 'genf', 'carouge', 'vernier', 'lancy', 'meyrin', 'onex', 'thônex', 'versoix', 'chêne-bougeries', 'grand-saconnex', 'plan-les-ouates'],
  },
  {
    id: 'VD',
    label: 'Vaud',
    cities: ['lausanne', 'montreux', 'vevey', 'nyon', 'morges', 'renens', 'yverdon', 'yverdon-les-bains', 'pully', 'prilly', 'la tour-de-peilz', 'aigle', 'bex', 'leysin', 'villars', 'château-d\'oex', 'payerne', 'moudon', 'echallens', 'orbe', 'rolle', 'gland', 'aubonne', 'cossonay', 'lutry', 'cully', 'lavaux', 'oron', 'avenches'],
  },
  {
    id: 'VS',
    label: 'Valais',
    cities: ['sion', 'sitten', 'martigny', 'monthey', 'sierre', 'brig', 'brigue', 'visp', 'viège', 'zermatt', 'verbier', 'crans-montana', 'montana', 'crans', 'leukerbad', 'loèche-les-bains', 'nendaz', 'fully', 'conthey', 'savièse', 'grimisuat', 'ayent', 'lens', 'anniviers', 'hérémence', 'evolène', 'champéry', 'val d\'illiez', 'troistorrents', 'collombey-muraz', 'vouvry', 'saint-maurice', 'orsières', 'bagnes', 'riddes', 'saxon', 'charrat', 'leytron', 'chamoson', 'ardon', 'vétroz'],
  },
  {
    id: 'NE',
    label: 'Neuchâtel',
    cities: ['neuchâtel', 'la chaux-de-fonds', 'le locle', 'val-de-travers', 'boudry', 'cortaillod', 'peseux', 'corcelles-cormondrèche', 'milvignes', 'val-de-ruz', 'la côte-aux-fées', 'le landeron', 'saint-blaise', 'hauterive'],
  },
  {
    id: 'FR',
    label: 'Fribourg',
    cities: ['fribourg', 'freiburg', 'bulle', 'villars-sur-glâne', 'marly', 'granges-paccot', 'givisiez', 'corminboeuf', 'düdingen', 'guin', 'morat', 'murten', 'estavayer-le-lac', 'estavayer', 'romont', 'châtel-saint-denis', 'attalens', 'veveyse', 'gruyères', 'broc', 'charmey', 'schwarzsee', 'lac noir', 'schmitten', 'tafers', 'tavel', 'wünnewil-flamatt', 'heitenried', 'plaffeien', 'plasselb', 'jaun', 'bellegarde'],
  },
  {
    id: 'JU',
    label: 'Jura',
    cities: ['delémont', 'porrentruy', 'saignelégier', 'les breuleux', 'le noirmont', 'les bois', 'la chaux-des-breuleux', 'bassecourt', 'courfaivre', 'courtételle', 'develier', 'moutier', 'reconvilier', 'tavannes', 'tramelan', 'saint-imier', 'la neuveville', 'courtelary'],
  },
  // Suisse alémanique
  {
    id: 'BE',
    label: 'Berne',
    cities: ['bern', 'berne', 'biel', 'bienne', 'thun', 'thoune', 'köniz', 'burgdorf', 'berthoud', 'langenthal', 'interlaken', 'spiez', 'münsingen', 'worb', 'belp', 'ittigen', 'ostermundigen', 'muri bei bern', 'zollikofen', 'lyss', 'aarberg', 'nidau', 'steffisburg', 'heimberg', 'uetendorf', 'lauterbrunnen', 'grindelwald', 'wengen', 'mürren', 'gstaad', 'saanen', 'lenk', 'adelboden', 'kandersteg', 'frutigen'],
  },
  {
    id: 'ZH',
    label: 'Zurich',
    cities: ['zürich', 'zurich', 'winterthur', 'winterthour', 'uster', 'dübendorf', 'dietikon', 'wädenswil', 'horgen', 'bülach', 'thalwil', 'kloten', 'schlieren', 'regensdorf', 'wetzikon', 'adliswil', 'opfikon', 'wallisellen', 'küsnacht', 'meilen', 'stäfa', 'männedorf', 'rüti', 'richterswil', 'affoltern am albis', 'hinwil', 'volketswil', 'effretikon', 'illnau-effretikon', 'pfäffikon'],
  },
  {
    id: 'LU',
    label: 'Lucerne',
    cities: ['luzern', 'lucerne', 'emmen', 'kriens', 'horw', 'ebikon', 'sursee', 'hochdorf', 'rothenburg', 'meggen', 'root', 'adligenswil', 'buchrain', 'gisikon', 'honau', 'meierskappel', 'risch', 'küssnacht', 'weggis', 'vitznau', 'gersau', 'brunnen', 'entlebuch', 'escholzmatt', 'marbach', 'schüpfheim', 'willisau'],
  },
  {
    id: 'AG',
    label: 'Argovie',
    cities: ['aarau', 'baden', 'wettingen', 'wohlen', 'brugg', 'lenzburg', 'rheinfelden', 'zofingen', 'oftringen', 'olten', 'reinach', 'muri', 'bremgarten', 'mellingen', 'spreitenbach', 'obersiggenthal', 'untersiggenthal', 'turgi', 'ennetbaden', 'würenlingen', 'döttingen', 'klingnau', 'zurzach', 'bad zurzach', 'frick', 'kaiseraugst', 'möhlin'],
  },
  {
    id: 'SG',
    label: 'Saint-Gall',
    cities: ['st. gallen', 'saint-gall', 'st.gallen', 'rapperswil-jona', 'rapperswil', 'wil', 'gossau', 'altstätten', 'buchs', 'uzwil', 'flawil', 'wattwil', 'rorschach', 'heerbrugg', 'widnau', 'oberriet', 'rebstein', 'marbach', 'rheineck', 'thal', 'goldach', 'mörschwil', 'steinach', 'arbon'],
  },
  {
    id: 'BS',
    label: 'Bâle-Ville',
    cities: ['basel', 'bâle', 'riehen', 'bettingen'],
  },
  {
    id: 'BL',
    label: 'Bâle-Campagne',
    cities: ['liestal', 'allschwil', 'reinach', 'muttenz', 'pratteln', 'binningen', 'bottmingen', 'oberwil', 'therwil', 'arlesheim', 'birsfelden', 'münchenstein', 'aesch', 'pfeffingen', 'ettingen', 'biel-benken', 'sissach', 'gelterkinden', 'laufen'],
  },
  {
    id: 'SO',
    label: 'Soleure',
    cities: ['solothurn', 'soleure', 'olten', 'grenchen', 'granges', 'zuchwil', 'biberist', 'derendingen', 'langendorf', 'bellach', 'selzach', 'bettlach', 'balsthal', 'oensingen', 'trimbach', 'schönenwerd', 'däniken', 'dulliken', 'starrkirch-wil', 'wangen bei olten', 'eppenberg-wöschnau', 'hägendorf'],
  },
  {
    id: 'TI',
    label: 'Tessin',
    cities: ['lugano', 'bellinzona', 'bellinzone', 'locarno', 'mendrisio', 'chiasso', 'ascona', 'giubiasco', 'minusio', 'losone', 'muralto', 'tenero', 'magadino', 'gordola', 'biasca', 'airolo', 'faido', 'bodio', 'pollegio', 'arbedo-castione', 'camorino', 'monte carasso', 'sementina', 'gudo', 'cadenazzo'],
  },
  {
    id: 'GR',
    label: 'Grisons',
    cities: ['chur', 'coire', 'davos', 'st. moritz', 'saint-moritz', 'arosa', 'klosters', 'flims', 'laax', 'lenzerheide', 'pontresina', 'scuol', 'poschiavo', 'bregaglia', 'val müstair', 'disentis', 'ilanz', 'thusis', 'tiefencastel', 'savognin', 'splügen', 'andeer', 'zillis', 'zernez', 'samedan', 'celerina', 'bever', 'la punt', 'zuoz', 's-chanf', 'silvaplana', 'sils', 'maloja'],
  },
  {
    id: 'TG',
    label: 'Thurgovie',
    cities: ['frauenfeld', 'kreuzlingen', 'arbon', 'amriswil', 'romanshorn', 'weinfelden', 'münchwilen', 'sirnach', 'bischofszell', 'diessenhofen', 'steckborn', 'horn', 'egnach', 'salmsach', 'kesswil', 'güttingen', 'bottighofen', 'tägerwilen'],
  },
  {
    id: 'SH',
    label: 'Schaffhouse',
    cities: ['schaffhausen', 'schaffhouse', 'neuhausen', 'neuhausen am rheinfall', 'thayngen', 'beringen', 'stein am rhein', 'hallau', 'wilchingen', 'schleitheim'],
  },
  {
    id: 'ZG',
    label: 'Zoug',
    cities: ['zug', 'zoug', 'baar', 'cham', 'steinhausen', 'risch-rotkreuz', 'hünenberg', 'unterägeri', 'oberägeri', 'menzingen', 'neuheim', 'walchwil'],
  },
  {
    id: 'SZ',
    label: 'Schwytz',
    cities: ['schwyz', 'schwytz', 'einsiedeln', 'freienbach', 'küssnacht', 'wollerau', 'feusisberg', 'lachen', 'altendorf', 'galgenen', 'tuggen', 'wangen', 'reichenburg', 'schübelbach', 'innerthal', 'vorderthal', 'muotathal', 'illgau', 'morschach', 'riemenstalden', 'sattel', 'rothenthurm', 'oberiberg', 'unteriberg', 'alpthal', 'brunnen', 'ingenbohl', 'arth', 'goldau', 'steinen', 'steinerberg', 'lauerz'],
  },
  {
    id: 'GL',
    label: 'Glaris',
    cities: ['glarus', 'glaris', 'näfels', 'mollis', 'netstal', 'ennenda', 'riedern', 'schwanden', 'mitlödi', 'schwändi', 'sool', 'haslen', 'nidfurn', 'leuggelbach', 'luchsingen', 'diesbach', 'betschwanden', 'rüti', 'braunwald', 'elm', 'matt', 'engi', 'obstalden', 'filzbach', 'mühlehorn', 'bilten', 'niederurnen', 'oberurnen'],
  },
  {
    id: 'OW',
    label: 'Obwald',
    cities: ['sarnen', 'kerns', 'sachseln', 'alpnach', 'giswil', 'lungern', 'engelberg'],
  },
  {
    id: 'NW',
    label: 'Nidwald',
    cities: ['stans', 'hergiswil', 'buochs', 'ennetbürgen', 'stansstad', 'beckenried', 'emmetten', 'dallenwil', 'wolfenschiessen', 'oberdorf', 'ennetmoos'],
  },
  {
    id: 'UR',
    label: 'Uri',
    cities: ['altdorf', 'erstfeld', 'schattdorf', 'bürglen', 'flüelen', 'silenen', 'seedorf', 'attinghausen', 'isenthal', 'bauen', 'sisikon', 'spiringen', 'unterschächen', 'wassen', 'göschenen', 'gurtnellen', 'realp', 'hospental', 'andermatt'],
  },
  {
    id: 'AR',
    label: 'Appenzell Rhodes-Extérieures',
    cities: ['herisau', 'teufen', 'speicher', 'trogen', 'heiden', 'walzenhausen', 'lutzenberg', 'wolfhalden', 'grub', 'rehetobel', 'wald', 'gais', 'bühler', 'stein', 'hundwil', 'schönengrund', 'waldstatt', 'schwellbrunn', 'urnäsch'],
  },
  {
    id: 'AI',
    label: 'Appenzell Rhodes-Intérieures',
    cities: ['appenzell', 'gonten', 'rüte', 'schlatt-haslen', 'schwende', 'oberegg'],
  },
];

/**
 * Trouve le canton d'une ville donnée
 * @param city Nom de la ville (insensible à la casse)
 * @returns L'ID du canton ou null si non trouvé
 */
export function findCantonByCity(city: string): string | null {
  if (!city) return null;

  const lowerCity = city.toLowerCase().trim();

  for (const canton of SWISS_CANTONS) {
    if (canton.cities.some(c => lowerCity.includes(c) || c.includes(lowerCity))) {
      return canton.id;
    }
  }

  return null;
}

/**
 * Obtient la configuration d'un canton par son ID
 */
export function getCantonConfig(cantonId: string): CantonConfig | undefined {
  return SWISS_CANTONS.find(c => c.id === cantonId);
}

/**
 * Vérifie si une ville appartient à un canton donné
 * @param city Nom de la ville
 * @param cantonId ID du canton
 * @returns true si la ville est dans le canton
 */
export function isCityInCanton(city: string, cantonId: string): boolean {
  if (!city || !cantonId) return false;

  const canton = getCantonConfig(cantonId);
  if (!canton) return false;

  const lowerCity = city.toLowerCase().trim();
  return canton.cities.some(c => lowerCity.includes(c) || c.includes(lowerCity));
}

/**
 * Extrait les cantons uniques à partir d'une liste de villes
 * @param cities Liste de noms de villes
 * @returns Liste des cantons correspondants (sans doublons)
 */
export function getUniqueCantons(cities: string[]): CantonConfig[] {
  const cantonIds = new Set<string>();

  cities.forEach(city => {
    const cantonId = findCantonByCity(city);
    if (cantonId) {
      cantonIds.add(cantonId);
    }
  });

  return SWISS_CANTONS.filter(c => cantonIds.has(c.id));
}
