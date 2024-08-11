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

    const skillsLearnFromTaming = 'skills';
    const tamingRate = 'rate';
    const tamingHpRequirement = 'hp';
    const tamingStateRequirement = 'state';

    const tamingRequirements = 'requirements';
    const tamingSuccess = 'success';
    const tamingFailure = 'failure';

 	// Plugin commands
    let old_Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        old_Game_Interpreter_pluginCommand.call(this, command, args);

        if(command.toLowerCase() === 'moosetame') {
			tame();
        }
    }

    function tame() {
    	let caster = BattleManager._subject;
    	let troopEnemy = getTroopEnemy()
    	let enemy = getLastTargetedEnemy();

    	let configuration = getDefaultConfiguration();

    	configuration = fillConfiguration(configuration, caster, enemy);

    	console.log(configuration);

    	if (!configuration['tamable']) {
    		// @todo: make non-tamable message configurable in parameters
    		// @todo: add sound?
    		$gameMessage.add(`${enemy.name} can't be tamed!`);

    		return;
    	}

    	// This needs to be last item in call pile.
    	configuration = removeEnemyOnSuccessfulTaming(configuration, troopEnemy);

    	if (!requirementAreMet(configuration[tamingRequirements], troopEnemy)) {
    		console.log('requirements not met');

    		playFailSound();

			// @todo: make fail message configurable in parameters
    		$gameMessage.add(`${caster.name()} failed to tame ${enemy.name}!`);

    		return;
    	}

    	console.log('requirements met');

    	let modifier = 0;

    	// Computes variations based on which states the enemy is afflicted with
    	let enemyStateBasedRateModfier = getStateModifier(troopEnemy);
    	let casterStateBasedRateModfier = getStateModifier(caster);
    	let gearBasedRateModfier = getGearModifier(caster);
    	let classBasedRateModfier = getClassModifier(caster);

    	modifier += enemyStateBasedRateModfier;
    	modifier += gearBasedRateModfier;
    	modifier += classBasedRateModfier;
    	modifier += casterStateBasedRateModfier;

    	if (rollTameThrow(configuration['rate'], modifier)) {
    		// @todo: make success message configurable in parameters
    		$gameMessage.add(`${caster.name()} tamed a ${enemy.name}!`);

    		// @todo: add sound? check $dataSystem.sounds #8
    		let initialEscapeSound = getSystemEscapeSound();

    		console.log(initialEscapeSound);

    		setEscapeSoundForTaming();

    		for(executable of configuration[tamingSuccess]) {
    			executable();
    		}

    		restoreSystemEscapeSound(initialEscapeSound);

    		return;
    	}

    	playFailSound();

    	$gameMessage.add(`${caster.name()} failed to tame ${enemy.name}!`);
    }

    // ===========================
    // === Taming Requirements ===
    // ===========================

function getDefaultConfiguration()
    {
    	let configuration = {};
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
					configuration['rate'] = value;
					break;
				case tamingHpRequirement:
					configuration = addHpRequirement(value, configuration);
					break;
				case tamingStateRequirement:
					configuration = addStateRequirement(value, configuration, enemy);
					break;

			}
		}

		return configuration;
    }

    function addSkillConfiguration(value, configuration, caster) {
    	configuration[tamingSuccess] = [];

    	for(skillId of value) {
    		let skill = $dataSkills[skillId];

    		// Don't queue learning a skill that is already known
    		if (!caster.isLearnedSkill(skillId)) {
	    		configuration[tamingSuccess].push(function () {
	    			caster.learnSkill(skillId);
	    			// @todo: make this string configurable in parameters
	    			$gameMessage.add(`${caster.name()} learnt ${skill.name}!`);
	    		});
    		}
    	}

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
    	let states = value.split(',').map(s => s.trim());

    	configuration[tamingRequirements].push(function(enemy) {
    		let hasAllRequiredStates = true;

	    	for (state of states) {
	    		state = parseInt(state);
	    		hasAllRequiredStates = hasAllRequiredStates && enemy.isStateAffected(state);
	    	}

    		return hasAllRequiredStates;
    	});

    	return configuration;
    }

    function requirementAreMet(requirements, troopEnemy) {
    	if (requirements.length === 0) {
    		return true;
    	}

    	let reqsPile = true;

    	for(requirementChech of requirements) {
    		reqsPile = reqsPile && requirementChech(troopEnemy);
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
