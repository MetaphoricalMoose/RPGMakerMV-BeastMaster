/*:
 * ------------------------------------------------------------------------------
 * @plugindesc v0.1 - Tame wild enemies and use their powers!
 * @author Metaphoric Moose
 * @version 0.1
 * @url https://github.com/MetaphoricalMoose
 * 
 * @param Tame Success SE
 * 
 * @param Audio success
 * @parent Tame Success SE
 * @text Success SE (Default Equip1)
 * @type file
 * @dir audio/se
 * 
 * @param pan success
 * @parent Tame Success SE
 * @type number
 * @min -100
 * @max 100
 * @default 0
 * 
 * @param pitch success
 * @parent Tame Success SE
 * @type number
 * @min -50
 * @max 150
 * @default 100
 * 
 * @param volume success
 * @parent Tame Success SE
 * @type number
 * @min 0
 * @max 100
 * @default 90
 *
 * @param Tame Fail SE
 *
 * @param Audio fail
 * @parent Tame Fail SE
 * @text Fail SE (Default Equip1)
 * @type file
 * @dir audio/se
 * 
 * @param pan fail
 * @parent Tame Fail SE
 * @type number
 * @min -100
 * @max 100
 * @default 0
 * 
 * @param pitch fail
 * @parent Tame Fail SE
 * @type number
 * @min -50
 * @max 150
 * @default 100
 * 
 * @param volume fail
 * @parent Tame Fail SE
 * @type number
 * @min 0
 * @max 100
 * @default 90
 *
 * @param Tame Strings
 *
 * @param No monster caught
 * @parent Tame Strings
 * @type text
 *
 * @param Monster not tamable
 * @parent Tame Strings
 * @type text
 *
 * @param Taming failed
 * @parent Tame Strings
 * @type text
 *
 * @param Taming success
 * @parent Tame Strings
 * @type text
 *
 * @param Skill learnt
 * @parent Tame Strings
 * @type text
 *
 * @param Replaces previous monster
 * @parent Tame Strings
 * @type text
 *
 * @param Gets new release
 * @parent Tame Strings
 * @type text
 *
 * ------------------------------------------------------------------------------
 * @help
 * Coming Soon
 */

var Imported = Imported || {};
Imported['Moose_Tame'] = "1.0";

var MooseTame = MooseTame || {};
MooseTame.parameters = {};

(function() {
    const parameters = PluginManager.parameters('Moose_Tame');
    const escapeSeIndex = 8;

    const skillsLearnFromTaming = 'skills';
    const tamingRate = 'rate';
    const tamingRateBonus = 'rateBonus';
    const tamingHpRequirement = 'hp';
    const tamingStateRequirement = 'state';
    const onTamingFailRemoveState = 'onfailremovestate';
    const onTamingFailAddState = 'onfailaddstate';
    const baitRequirement = 'bait';
    const baitBonus = 'baitbonus';
    const releaseSkill = 'release';

    const tamingRequirements = 'requirements';
    const tamingSuccess = 'success';
    const tamingFailure = 'failure';

    const markBaitRequired = 'must';

    const defaultStrings = {
    	'nomonstercaught': "__actor__ hasn't caught any monster yet!", // ${caster.name()} hasn't caught any monster yet!
    	'monsternottamable': "__enemy__ can't be tamed!", // ${enemy.name} can't be tamed!
    	'tamingfailed': "__actor__ failed to tame __enemy__!", // ${caster.name()} failed to tame ${enemy.name}!
    	'tamingsuccess': "__actor__ tamed a __enemy__!", // ${caster.name()} tamed a ${enemy.name}!
    	'skilllearnt': "__actor__ learnt __skill__!", // ${caster.name()} learnt ${skill.name}!
    	'replacespreviousmonster': "__enemy__ replaces previously caught monster.", // ${enemy.name} replaces previous caught monster.
    	'getsnewrelease': "__actor__ can release __enemy__ later!", // ${caster.name()} can release ${enemy.name} later!
    };

    MooseTame.parameters['success'] = {
    	'name': parameters['Audio success'],
    	'pan':parseInt( parameters['pan success']),
    	'pitch': parseInt(parameters['pitch success']),
    	'volume': parseInt(parameters['volume success']),
    };

    MooseTame.parameters['fail'] = {
    	'name': parameters['Audio fail'],
    	'pan': parseInt(parameters['pan fail']),
    	'pitch': parseInt(parameters['pitch fail']),
    	'volume': parseInt(parameters['volume fail']),
    };

    MooseTame.parameters['strings'] = {
    	'nomonstercaught': parameters['No monster caught'] ? parameters['No monster caught'] : defaultStrings['nomonstercaught'],
    	'monsternottamable': parameters['Monster not tamable'] ? parameters['Monster not tamable'] : defaultStrings['monsternottamable'],
    	'tamingfailed': parameters['Taming failed'] ? parameters['Taming failed'] : defaultStrings['tamingfailed'],
    	'tamingsuccess': parameters['Taming success'] ? parameters['Taming success'] : defaultStrings['tamingsuccess'],
    	'skilllearnt': parameters['Skill learnt'] ? parameters['Skill learnt'] : defaultStrings['skilllearnt'],
    	'replacespreviousmonster': parameters['Replaces previous monster'] ? parameters['Replaces previous monster'] : defaultStrings['replacespreviousmonster'],
    	'getsnewrelease': parameters['Gets new release'] ? parameters['Gets new release'] : defaultStrings['getsnewrelease'],
    };

 	// Plugin commands
    let old_Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        old_Game_Interpreter_pluginCommand.call(this, command, args);

        if(command.toLowerCase() === 'moosetame') {
			tame();
        }

        if(command.toLowerCase() === 'moosetamerelease') {
			release();
        }
    }

    function release()
    {
    	let caster = BattleManager._subject;
    	let casterId = caster._actorId;

		if (releaseMap[casterId]) {
    		// Monster caught
    		caster.forceAction(releaseMap[casterId].skill.id, -1); // -1 = random target
    		releaseMap[casterId] = null; // monster was set lose, unset value
    	} else {
    		// No monster caught
    		$gameMessage.add(MooseTame.parameters['strings']['nomonstercaught'].replace('__actor__', caster.name()));
    	}
    }

    function tame()
    {
    	let caster = BattleManager._subject;
    	let troopEnemy = getTroopEnemy()
    	let enemy = getLastTargetedEnemy();
    	let configuration = getDefaultConfiguration();

    	configuration = fillConfiguration(configuration, caster, enemy);

    	if (!configuration['tamable']) {
    		$gameMessage.add(MooseTame.parameters['strings']['monsternottamable'].replace('__enemy__', enemy.name));

    		return;
    	}

    	// This needs to be last item in call pile.
    	configuration = removeEnemyOnSuccessfulTaming(configuration, troopEnemy);

    	if (!requirementAreMet(configuration[tamingRequirements], troopEnemy, caster)) {
    		playFailSound();

			let message = MooseTame.parameters['strings']['tamingfailed'].replace('__actor__', caster.name()).replace('__enemy__', enemy.name);
    		$gameMessage.add(message);

    		for(executable of configuration[tamingFailure]) {
    			executable(troopEnemy);
    		}

    		return;
    	}

    	let modifier = 0;

    	// Computes variations based on which states the enemy is afflicted with
    	let enemyStateBasedRateModfier = getStateModifier(troopEnemy);
    	let casterStateBasedRateModfier = getStateModifier(caster);
    	let gearBasedRateModfier = getGearModifier(caster);
    	let classBasedRateModfier = getClassModifier(caster);

    	modifier += configuration[baitBonus];
    	modifier += enemyStateBasedRateModfier;
    	modifier += gearBasedRateModfier;
    	modifier += classBasedRateModfier;
    	modifier += casterStateBasedRateModfier;

    	if (rollTameThrow(configuration['rate'], modifier)) {
			let message = MooseTame.parameters['strings']['tamingsuccess'].replace('__actor__', caster.name()).replace('__enemy__', enemy.name);
    		$gameMessage.add(message);

    		let initialEscapeSound = getSystemEscapeSound();

    		setEscapeSoundForTaming();

    		for(executable of configuration[tamingSuccess]) {
    			executable(caster);
    		}

    		restoreSystemEscapeSound(initialEscapeSound);

    		return;
    	}

    	playFailSound();

    	let message = MooseTame.parameters['strings']['tamingfailed'].replace('__actor__', caster.name()).replace('__enemy__', enemy.name);
    	$gameMessage.add(message);
    }

    // ===================
    // === Persistance ===
    // ===================

	let releaseMap = {};
    let _mooseTame_DataManager_makeSaveContents = DataManager.makeSaveContents;
    let _mooseTame_DataManager_extractSaveContents = DataManager.extractSaveContents;

    DataManager.makeSaveContents = function() {
    	let contents = _mooseTame_DataManager_makeSaveContents.call(this);
    	contents.releaseMap = releaseMap;

    	return contents;
    };

    DataManager.extractSaveContents = function(contents) {
		_mooseTame_DataManager_extractSaveContents.call(this, contents);
		releaseMap = contents.releaseMap;
	};

    // ===========================
    // === Taming Requirements ===
    // ===========================

	function getDefaultConfiguration()
    {
    	let configuration = {};
    	configuration[baitBonus] = 0;
    	configuration[tamingRate] = 100;
    	configuration[tamingRequirements] = [];
    	configuration[tamingSuccess] = [];
    	configuration[tamingFailure] = [];

    	return configuration;
    }

    function getLastTargetedEnemy() {
    	let troopEnemy = getTroopEnemy();
    	let enemyId = troopEnemy._enemyId;
    	let enemy = $dataEnemies[enemyId];

    	return enemy;
    }

    function getTroopEnemy() {
		let lastTargetEnemyIndex = BattleManager._subject._lastTargetIndex;

    	return $gameTroop.members()[lastTargetEnemyIndex];
    }

    function fillConfiguration(configuration, caster, enemy)
    {
		let linesRelevantToTaming = getNoteLinesRelevantToTaming(enemy.note);

		if (linesRelevantToTaming.length === 0) {
			configuration['tamable'] = false;

			return configuration;
		}

		configuration['tamable'] = true;

		for(line of linesRelevantToTaming) {
			let [property,value] = line.split(':');

			switch (property.trim().toLowerCase()) {
				case skillsLearnFromTaming:
					configuration = addSkillConfiguration(value, configuration, caster);
					break;
				case tamingRate:
					configuration['rate'] = parseInt(value);
					break;
				case tamingHpRequirement:
					configuration = addHpRequirement(value, configuration);
					break;
				case tamingStateRequirement:
					configuration = addStateRequirement(value, configuration, enemy);
					break;
				case onTamingFailRemoveState:
					configuration = changeStatesOnFailure(value, configuration, enemy, onTamingFailRemoveState);
					break;
				case onTamingFailAddState:
					configuration = changeStatesOnFailure(value, configuration, enemy, onTamingFailAddState);
					break;
				case baitRequirement:
					configuration = addBaitRequirement(value, configuration, caster);
					break;
				case releaseSkill:
					configuration = AddReleaseSkillConfiguration(value, configuration, caster, enemy);
					break;
			}
		}

		return configuration;
    }

    function addSkillConfiguration(value, configuration, caster)
    {
    	skillIds = value.split(',').map(e => parseInt(e.trim()));

    	configuration[tamingSuccess].push(function (caster) {
    		let skill;

    		for(skillId of skillIds) {
    			skill = $dataSkills[skillId];

    			if (!caster.isLearnedSkill(skillId)) {
	    			caster.learnSkill(skillId);
	    			let message = MooseTame.parameters['strings']['skilllearnt'].replace('__actor__', caster.name()).replace('__skill__', skill.name);
	    			$gameMessage.add(message);
	    		}
    		}
    	});

    	return configuration;
    }

    function AddReleaseSkillConfiguration(value, configuration, caster, enemy)
    {
    	skillId = value.split(',')[0];

    	let skill = $dataSkills[skillId];

		configuration[tamingSuccess].push(function (caster) {
			if (releaseMap[caster._actorId]) {
				$gameMessage.add(MooseTame.parameters['strings']['replacespreviousmonster'].replace('__enemy__', enemy.name));
			}

			let message = MooseTame.parameters['strings']['getsnewrelease'].replace('__actor__', caster.name()).replace('__enemy__', enemy.name);
			$gameMessage.add(message);

			releaseMap[caster._actorId] = {
				skill:skill,
				enemy: enemy.id
			};
		});

    	return configuration;
    }

    function addHpRequirement(value, configuration) {
    	let lowerBound,higherBound;
    	let includesLowerBound = value.indexOf('-');

    	if (~includesLowerBound) {
    		[lowerBound,higherBound] = value.split('-');
    		lowerBound = parseInt(lowerBound);
    		higherBound = parseInt(higherBound);
    	} else {
			lowerBound = 0;
			higherBound = value;
    	}

    	configuration[tamingRequirements].push(function(enemy) {
    		let hpPercentage = Math.round(enemy.hp/enemy.mhp*100);

    		return hpPercentage >= lowerBound && hpPercentage <= higherBound;
    	});

    	return configuration;
    }

    function addStateRequirement(value, configuration) {
    	let states = value.split(',').map(s => parseInt(s.trim()));

    	configuration[tamingRequirements].push(function(enemy) {
    		let hasAllRequiredStates = true;

	    	for (state of states) {
	    		hasAllRequiredStates = hasAllRequiredStates && enemy.isStateAffected(state);
	    	}

	    	return hasAllRequiredStates;
    	});

    	return configuration;
    }

    function changeStatesOnFailure(value, configuration, enemy, action) {
    	let states = value.split(',').map(s => parseInt(s.trim()));

    	configuration[tamingFailure].push(function(enemy) {
	    	for (state of states) {
	    		action === onTamingFailAddState ? enemy.addState(state) : enemy.removeState(state);
	    	}
    	});

    	return configuration;
    }

    function addBaitRequirement(value, configuration, caster) {
    	// Remove empty slot data and weapons
    	let equipment = {};
    	let equips = caster.equips();
    	let equipsKeys = equips.keys();

    	for (key of equipsKeys) {
    		if (equips[key]) {
    			equips[key]['slotId'] = key;
    		}
    	}

    	let equippedItems = equips.filter(e => e !== null && e.atypeId !== undefined);

    	let enemyBaitValues = value.split(',').map(e => e.trim());
    	let baitIsMarkedRequired = enemyBaitValues.contains(markBaitRequired);
    	let enemyBaitIds = enemyBaitValues.filter(e => e !== markBaitRequired).map(e => parseInt(e));
    	let effectiveBait = equippedItems.filter(e => enemyBaitIds.contains(e.id));


    	let baitNote, property, confValue;

    	let slotsToClear = [];

    	for (bait of effectiveBait) {
    		baitNote = getNoteLinesRelevantToTaming(bait.note);
    		slotsToClear.push(bait.slotId);

			for(line of baitNote) {
				[property,confValue] = line.split(':');

				if (property.trim().toLowerCase() === baitBonus) {
					configuration[baitBonus] += parseInt(confValue);
				}
			}
    	}

    	if (baitIsMarkedRequired) {
    		configuration[tamingRequirements].push(function(troopEnemy, caster) {
    			let equippedItemsId = caster.equips()
    				.filter(e => e !== null && e.atypeId !== undefined)
    				.map(e => parseInt(e.id));

    			let effectiveBaits = equippedItemsId.filter(e => enemyBaitIds.contains(e));

    			return effectiveBait.length > 0;
    		});
    	}		

    	configuration[tamingSuccess].push(function(actor) {
    		let item;

    		for(slotId of slotsToClear) {
    			item = actor.equips()[slotId];

    			actor.discardEquip(item);
    		}
    	});

    	return configuration;
    }

    function requirementAreMet(requirements, troopEnemy, caster) {
    	if (requirements.length === 0) {
    		return true;
    	}

    	let reqsPile = true;

    	for(requirementChech of requirements) {
    		reqsPile = reqsPile && requirementChech(troopEnemy, caster);
    	}

    	return reqsPile;
    }

    function removeEnemyOnSuccessfulTaming(configuration, enemy) {
		configuration[tamingSuccess].push(function() {
			enemy.escape();
		});

		return configuration;
    }

    // ======================
    // === Rate Computing ===
    // ======================

    function rollTameThrow(rate, modifier)
    {
    	let roll = Math.floor(Math.random() * 100) + 1;
    	let modifiedRate = rate + modifier;

    	return roll < modifiedRate;
    }

	function getGearModifier(caster)
	{
		let rateModifier = 0;
		let equippedItems = caster.equips().filter(e => e !== null);
		let note, itemTamingNote;

		for (item of equippedItems) {
			itemTamingNote = getNoteLinesRelevantToTaming(item.note);
			rateModifier += getRateModifierFromNoteLines(itemTamingNote);
		}

		return rateModifier;
	}

	function getClassModifier(caster)
	{
		let rateModifier = 0;
		let casterClass = caster.currentClass();
		let classTamingNote = getNoteLinesRelevantToTaming(casterClass.note);

		rateModifier += getRateModifierFromNoteLines(classTamingNote);

		return rateModifier;
	}

	function getStateModifier(enemy)
	{
		let rateModifier = 0;
		let states = enemy.states();
		let statesTamingNote;

		for (state of states) {
			statesTamingNote = getNoteLinesRelevantToTaming(state.note);
			rateModifier += getRateModifierFromNoteLines(statesTamingNote);
		}

		return rateModifier;
	}

	function getRateModifierFromNoteLines(linesRelevantToTaming)
	{
		let property,value;

		for(line of linesRelevantToTaming) {
			[property,value] = line.split(':');

			if (property.trim().toLowerCase() === tamingRate) {
				return parseInt(value);
			}
		}

		return 0;		
	}    

    function getNoteLinesRelevantToTaming(note)
    {
    	let noteLines = note.split(/[\r\n]+/);
		let openingTagIndex = noteLines.indexOf('<Tame>');
		let closingTagIndex = noteLines.indexOf('</Tame>');

		if (!~openingTagIndex || !~closingTagIndex) {
			return [];
		}

		return linesRelevantToTaming = noteLines.slice(++openingTagIndex, closingTagIndex);
    }

    // =====================
    // === Sound effects ===
    // =====================

    function playFailSound()
    {
    	if (MooseTame.parameters['fail']['name']) {
	    	AudioManager.playSe(MooseTame.parameters['fail']);
	    }
    }

    function getSystemEscapeSound()
    {
    	return $dataSystem.sounds[escapeSeIndex];
    }

    function restoreSystemEscapeSound(se)
    {
    	$dataSystem.sounds[escapeSeIndex] = se;
    }

    function setEscapeSoundForTaming()
    {

    	if (MooseTame.parameters['success']['name']) {
    		$dataSystem.sounds[escapeSeIndex] = MooseTame.parameters['success'];
    	}
    }
})();
