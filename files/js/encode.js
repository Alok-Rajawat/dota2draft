var draftParameters = {
	heroes : ['empty',
    'earthshaker',
	'sven',
	'tiny',
	'kunkka',
	'beastmaster',
	'dragon_knight',
	'clockwerk',
	'omniknight',
	'huskar',
	'alchemist',
	'brewmaster',
	'treant_protector',
	'whisp',
	'anti_mage',
	'drow_ranger',
	'juggernaut',
	'mirana',
	'morphling',
	'phantom_lancer',
	'vengeful_spirit',
	'riki',
	'sniper',
	'templar_assassin',
	'luna',
	'bounty_hunter',
	'ursa',
	'gyrocopter',
	'lone_druid',
	'naga_siren',
	'crystal_maiden',
	'puck',
	'storm_spirit',
	'windrunner',
	'zeus',
	'lina',
	'shadow_shaman',
	'tinker',
	'natures_prophet',
	'enchantress',
	'jakiro',
	'chen',
	'silencer',
	'ogre_magi',
	'rubick',
	'disruptor',
	'axe',
	'pudge',
	'sand_king',
	'slardar',
	'tidehunter',
	'skeleton_king',
	'lifestealer',
	'night_stalker',
	'doom_bringer',
	'spirit_breaker',
	'lycanthrope',
	'chaos_knight',
	'undying',
	'bloodseeker',
	'shadow_fiend',
	'razor',
	'venomancer',
	'faceless_void',
	'phantom_assassin',
	'viper',
	'clinkz',
	'broodmother',
	'weaver',
	'spectre',
	'bane',
	'lich',
	'lion',
	'witch_doctor',
	'enigma',
	'necrolyte',
	'warlock',
	'queen_of_pain',
	'death_prophet',
	'pugna',
	'dazzle',
	'leshrac',
	'dark_seer',
	'batrider',
	'ancient_apparition',
	'invoker',
	'outlord_destroyer',
	'shadow_demon',
	'nyx_assassin',
	'keeper_of_the_light',
	'visage',
	'meepo',
	'magnus',
	'centaur',
	'slark',
	'shredder',
	'troll_warlord',
	'medusa',
	'tusk',
    'bristleback',
    'skywrath_mage',
    'elder_titan',
    'abaddon',
    'earth_spirit',
    'ember_spirit',
    'legion_commander',
    'phoenix',
    'terrorblade',
    'techies',
    'oracle',
    'winter_wyvern',
	'arc_warden',
	'underlord',
	'monkey_king'],
	
	lanes : ['Mid', 'Top', 'Bot', 'Woods', 'Roam'],
	
	heroesEncodage : ['0', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y',
		'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y',
		'Za', 'Zb', 'Zc', 'Zd', 'Ze', 'Zf', 'Zg', 'Zh', 'Zi', 'Zj', 'Zk', 'Zl', 'Zm', 'Zn', 'Zo', 'Zp', 'Zq', 'Zr', 'Zs', 'Zt', 'Zu', 'Zv', 'Zw', 'Zx', 'Zy',
		'ZA', 'ZB', 'ZC', 'ZD', 'ZE', 'ZF', 'ZG', 'ZH', 'ZI', 'ZJ', 'ZK', 'ZL', 'ZM', 'ZN', 'ZO', 'ZP', 'ZQ', 'ZR', 'ZS', 'ZT', 'ZU', 'ZV', 'ZW', 'ZX', 'ZY',
		'za', 'zb', 'zc', 'zd', 'ze', 'zf', 'zg', 'zh', 'zi', 'zj', 'zk', 'zl', 'zm', 'zn', 'zo', 'zp', 'zq', 'zr', 'zs', 'zt', 'zu', 'zv', 'zw', 'zx', 'zy',
		'zA', 'zB', 'zC', 'zD', 'zE', 'zF', 'zG', 'zH', 'zI', 'zJ', 'zK', 'zL', 'zM', 'zN', 'zO', 'zP', 'zQ', 'zR', 'zS', 'zT', 'zU', 'zV', 'zW', 'zX', 'zY',
		]}

function encode(draft) {
	var encoded = "pick=";
	
	var side = 'r';
	for (var i = 1; i < 6; i++) {
		encoded = encoded + draftParameters.heroesEncodage[draftParameters.heroes.indexOf(draft[side+'pick'][i])] 
			+ draftParameters.lanes.indexOf(draft[side+'pick'][i+'pos']);
	}
	
	side = 'd';
	for (var i = 1; i < 6; i++) {
		encoded = encoded + draftParameters.heroesEncodage[draftParameters.heroes.indexOf(draft[side+'pick'][i])] 
			+ draftParameters.lanes.indexOf(draft[side+'pick'][i+'pos']);
	}
	
	encoded = encoded + "&ban=";
	
	side = 'r';
	for (var i = 1; i < 6; i++)
		encoded = encoded + draftParameters.heroesEncodage[draftParameters.heroes.indexOf(draft[side+'ban'][i])];
	
	side = 'd';
	for (var i = 1; i < 6; i++)
		encoded = encoded + draftParameters.heroesEncodage[draftParameters.heroes.indexOf(draft[side+'ban'][i])];
	
	return encoded;
};

function decodePicks(picks) {
	var draft = {};
	
	draft.rpick = {
		'1' : 'empty', '1pos' : 'Mid',
		'2' : 'empty', '2pos' : 'Mid',
		'3' : 'empty', '3pos' : 'Mid',
		'4' : 'empty', '4pos' : 'Mid',
		'5' : 'empty', '5pos' : 'Mid'};
		
	draft.dpick = {
		'1' : 'empty', '1pos' : 'Mid',
		'2' : 'empty', '2pos' : 'Mid',
		'3' : 'empty', '3pos' : 'Mid',
		'4' : 'empty', '4pos' : 'Mid',
		'5' : 'empty', '5pos' : 'Mid'};
		
	var aux = picks;
		
	var side = 'r';
	for(var i = 1; i < 6; i++) {
		if (draftParameters.heroesEncodage.indexOf(aux.substr(0,1)) != -1) {
			draft[side+'pick'][i] = draftParameters.heroes[draftParameters.heroesEncodage.indexOf(aux.substr(0,1))];
			aux = aux.substr(1, aux.length-1);
		} else {
			if (draftParameters.heroesEncodage.indexOf(aux.substr(0,2)) != -1) {
				draft[side+'pick'][i] = draftParameters.heroes[draftParameters.heroesEncodage.indexOf(aux.substr(0,2))];
				aux = aux.substr(2, aux.length-2);
			} else {
				return draft;
			}
		}
		draft[side+'pick'][i+'pos'] = draftParameters.lanes[aux.substr(0,1)];
		aux = aux.substr(1, aux.length-1);
	}
	
	var side = 'd';
	for(var i = 1; i < 6; i++) {
		if (draftParameters.heroesEncodage.indexOf(aux.substr(0,1)) != -1) {
			draft[side+'pick'][i] = draftParameters.heroes[draftParameters.heroesEncodage.indexOf(aux.substr(0,1))];
			aux = aux.substr(1, aux.length-1);
		} else {
			if (draftParameters.heroesEncodage.indexOf(aux.substr(0,2)) != -1) {
				draft[side+'pick'][i] = draftParameters.heroes[draftParameters.heroesEncodage.indexOf(aux.substr(0,2))];
				aux = aux.substr(2, aux.length-2);
			} else {
				return draft;
			}
		}
		draft[side+'pick'][i+'pos'] = draftParameters.lanes[aux.substr(0,1)];
		aux = aux.substr(1, aux.length-1);
	}
	
	return draft;
};

function decodeBans(banURL) {
	var bans = {};
	
	bans.rban = {
		'1' : 'earthshaker',
		'2' : 'earthshaker',
		'3' : 'earthshaker',
		'4' : 'earthshaker',
		'5' : 'earthshaker'};
		
	bans.dban = {
		'1' : 'earthshaker',
		'2' : 'earthshaker',
		'3' : 'earthshaker',
		'4' : 'earthshaker',
		'5' : 'earthshaker'};
		
	var aux = banURL;
	
	var side = 'r';
	for(var i = 1; i < 6; i++) {
		if (draftParameters.heroesEncodage.indexOf(aux.substr(0,1)) != -1) {
			bans[side+'ban'][i] = draftParameters.heroes[draftParameters.heroesEncodage.indexOf(aux.substr(0,1))];
			aux = aux.substr(1, aux.length-1);
		} else {
			if (draftParameters.heroesEncodage.indexOf(aux.substr(0,2)) != -1) {
				bans[side+'ban'][i] = draftParameters.heroes[draftParameters.heroesEncodage.indexOf(aux.substr(0,2))];
				aux = aux.substr(2, aux.length-2);
			} else {
				return bans;
			}
		}
	}
	
	
	var side = 'd';
	for(var i = 1; i < 6; i++) {
		if (draftParameters.heroesEncodage.indexOf(aux.substr(0,1)) != -1) {
			bans[side+'ban'][i] = draftParameters.heroes[draftParameters.heroesEncodage.indexOf(aux.substr(0,1))];
			aux = aux.substr(1, aux.length-1);
		} else {
			if (draftParameters.heroesEncodage.indexOf(aux.substr(0,2)) != -1) {
				bans[side+'ban'][i] = draftParameters.heroes[draftParameters.heroesEncodage.indexOf(aux.substr(0,2))];
				aux = aux.substr(2, aux.length-2);
			} else {
				return bans;
			}
		}
	}
		
	return bans;
};