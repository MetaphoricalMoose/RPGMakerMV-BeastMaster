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

    	if (rollTameThrow(configuration['rate'])) {
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

    function rollTameThrow(rate)
    {
    	let roll = Math.floor(Math.random() * 100) + 1;

    	console.log(`rate: ${rate}; rolled a ${roll}`);

    	return roll < rate;
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
		let noteLines = enemy.note.split(/[\r\n]+/);
		let openingTagIndex = noteLines.indexOf('<Tame>');
		let closingTagIndex = noteLines.indexOf('</Tame>');

		if (!~openingTagIndex || !~closingTagIndex) {
			configuration['tamable'] = false;

			return configuration;
		}

		configuration['tamable'] = true;

		let linesRelevantToTaming = noteLines.slice(++openingTagIndex, closingTagIndex);

		for(line of linesRelevantToTaming) {
			let [property,value] = line.split(':');

			switch (property.trim()) {
				case skillsLearnFromTaming:
					configuration = addSkillConfiguration(value, configuration, caster);
					break;
				case tamingRate:
					configuration['rate'] = value;
					break;
				case tamingHpRequirement:
					configuration = addHpRequirement(value, configuration);
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
    	configuration[tamingSuccess] = [];

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
