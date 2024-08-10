/*:
 * ------------------------------------------------------------------------------
 * @plugindesc v0.1 - Tame wild enemies and use their powers!
 * @author Metaphoric Moose
 * @version 0.1
 * @url https://github.com/MetaphoricalMoose
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
			// @todo: make fail message configurable in parameters
    		// @todo: add sound?
    		$gameMessage.add(`${caster.name()} failed to tame ${enemy.name}!`);

    		return;
    	}

    	console.log('requirements met');

    	let modifier = 0;

    	// Computes variations based on which states the enemy is afflicted with
    	let stateBasedRateModfier = getStateModifier(troopEnemy);
    	let gearBasedRateModfier = getGearModifier(caster);

    	console.log(`stateBasedRateModfier = ${stateBasedRateModfier}`);
    	console.log(`gearBasedRateModfier = ${gearBasedRateModfier}`);

    	modifier += stateBasedRateModfier;
    	modifier += gearBasedRateModfier;

    	if (rollTameThrow(configuration['rate'], modifier)) {
    		// @todo: make success message configurable in parameters
    		// @todo: add sound?
    		$gameMessage.add(`${caster.name()} tamed a ${enemy.name}!`);

    		for(executable of configuration[tamingSuccess]) {
    			executable();
    		}

    		return;
    	}

    	$gameMessage.add(`${caster.name()} failed to tame ${enemy.name}!`);
    }

    function rollTameThrow(rate, modifier)
    {
    	let roll = Math.floor(Math.random() * 100) + 1;

    	let modifiedRate = rate + modifier;


    	console.log(`Rolled ${roll} on rate ${modifiedRate}`);

    	return roll < modifiedRate;
    }

	function getGearModifier(caster)
	{
		let rateModifier = 0;
		let equippedItems = caster.equips().filter(e => e !== null);
		let note, itemTamingNote;

		console.log(equippedItems);

		for (item of equippedItems) {
			console.log(item);

			itemTamingNote = getNoteLinesRelevantToTaming(item.note);
			rateModifier += getRateModifierFromNoteLines(itemTamingNote);

			console.log(`item rate: ${getRateModifierFromNoteLines(itemTamingNote)}`);
		}


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
		for(line of linesRelevantToTaming) {
			let [property,value] = line.split(':');

			if (property.trim().toLowerCase() === tamingRate) {
				return parseInt(value);
			}
		}

		return 0;		
	}

	

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
})();
