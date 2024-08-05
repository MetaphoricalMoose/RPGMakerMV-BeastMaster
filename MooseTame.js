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

    	// This needs to be last item in call pile.
    	configuration = removeEnemyOnSuccessfulTaming(configuration, troopEnemy);

    	if (requirementAreMet(configuration['requirements'])) {
    		// @todo: make success message configurable in parameters
    		// @todo: add sound?
    		$gameMessage.add(`${caster.name()} tamed a ${enemy.name}!`);

    		for(executable of configuration[tamingSuccess]) {
    			executable()
    		}
    	} else {
    		// @todo: make fail message configurable in parameters
    		// @todo: add sound?
    		console.log("Taming failed");
    	}
    }

    function getDefaultConfiguration()
    {
    	return {
			'rate': 100,
			'requirements': [],
			tamingSuccess: [],
			tamingFailure: [],
		};
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
		let linesRelevantToTaming = noteLines.slice(++openingTagIndex, closingTagIndex);

		for(line of linesRelevantToTaming) {
			let [property,value] = line.split(':');

			switch (property.trim()) {
				case skillsLearnFromTaming:
					configuration = addSkillConfiguration(value, configuration, caster);
					break;

			}
		}

		return configuration;
    }

    function addSkillConfiguration(value, configuration, caster) {
    	configuration[tamingSuccess] = [];

    	for(skillId of value) {
    		let skill = $dataSkills[skillId];

    		configuration[tamingSuccess].push(function () {
    			caster.learnSkill(skillId);
    			// @todo: make this string configurable in parameters
    			$gameMessage.add(`${caster.name()} learnt ${skill.name}!`);
    		});
    	}

    	return configuration;
    }

    function requirementAreMet(requirements) {
    	if (requirements.length === 0) {
    		return true;
    	}

    	return false;
    }

    function removeEnemyOnSuccessfulTaming(configuration, enemy) {
		configuration[tamingSuccess].push(function() {
			enemy.escape();
		});

		return configuration;
    }
})();
