/*:
 * ------------------------------------------------------------------------------
 * @plugindesc v1.0 - Tame wild enemies and use their powers!
 * @author Metaphoric Moose
 * @version 1.0
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
 *
 * This plugin adds mechanics to catch wild monster. You can define skills
 * that the user can learn from them, or use as a one-time release skill.
 *
 * If you need an example of the full set-up, there a demo/showcase is available
 * on github (https://github.com/MetaphoricalMoose/RPGMakerMV-BeastMaster)
 *
 * To make a monster tamable, you need to add a notetag to that specific monster,
 * to defined under what conditions is can be tamed and what happens when it's
 * successfully tamed.
 * 
 * First, the tame skill set up. This is done by creating a skill targeting one
 * single enemy, and making it call a common event that runs the "MooseTame"
 * command. That's it. We'll call that skill "Tame" in this help file.
 * 
 * From there, using the Tame skill on a monster without the notetag will simply
 * output a message to warn you this enemy can't be tamed.
 * 
 * To mark an enemy as tamable, the minimal notetag is:
 * <Tame>
 * </Tame>
 * 
 * Since this defined no taming requirements, success rate, or outcome, using
 * the Tame skill will always succeed and remove the enemy from the battlefield.
 * Under the hood, it forces it to flee, therefore voiding it's drops (XP, gold,
 * loot). But we can make this more interesting.
 * 
 * ------------------------------------------------------------------------------
 * Taming process
 * ------------------------------------------------------------------------------
 * 
 * When the Tame skill is used, the plugin will do these steps in this order:
 * 1. check if the enemy is tamable (see above)
 * 2. check if the taming requirements are met (see below)
 * 3. compute the taming modifier (see below)
 * 4. roll a 1d100 die (see below)
 * 5a. In case of success, apply successful outcome (see below)
 * 5b. In case of failure, apply failed outcome (see below)
 * 
 * ------------------------------------------------------------------------------
 * Taming requirements
 * ------------------------------------------------------------------------------
 * 
 * The first thing the MooseTame command will check, if whether the taming
 * requirements are met. They include: 
 * - the enemy being in a specific HP% range.
 * - the enemy being affected by one or more state.
 * - a specific bait being equipped (more on this on the bait section).
 * 
 * # HP range
 * 
 * To add an HP range requirement, your note tag can look like this:
 * 
 * <Tame>
 *  hp: 50
 * </Tame>
 * 
 * In this example (only one number defined), it means Tame will automatically
 * fail unless the enemy's current HP is above 50% of its max HP.
 * 
 * You can also use to numbers if you ned to be more precise.
 * 
 * <Tame>
 *  hp: 25-75
 * </Tame>
 * 
 * With this notetag, Taming will fail unless the enemy is between 25% and 75%
 * of its max HP.
 * 
 * # States
 * 
 * If you want to make it so an enemy can't be tamed unless it's affected by a
 * specific state, you can defined its notetag like this:
 * 
 * <Tame>
 *  state: 10
 * </Tame>
 * 
 * Assuming state with the 10 is Sleep (like by default), then Taming will
 * fail unless the enemy is asleep.
 * You can add multiple states if you seperate them with commas
 * 
 * ex: state: 4,10
 * 
 * Note that this will make BOTH states required for taming.
 * 
 * # Bait
 *
 * Bait has its own section below. For the purpose of the requirements section, 
 * we'll only give an example of a configuration to make it mandatory that
 * the actor using Tame has a bait (= an armor with a notetag) equipped:
 * 
 * <Tame>
 *  bait: 4, must
 * </Tame>
 * 
 * With this notetag, the actor must have the armor with id 4 equipped when
 * using Tame for it to have a chance to succeed. The keyword "must" being the
 * part that transforms bait from a bonus to a requirement.
 *
 * You can define a comma-separated list of bait, and if you do so, any will
 * work. For example:
 * 
 * <Tame>
 *  bait: 4,5 must
 * </Tame>
 * 
 * That way, have either bait with with armor id 4 or 5 will work fine.
 * 
 * ------------------------------------------------------------------------------
 * Taming rate
 * ------------------------------------------------------------------------------
 * 
 * The taming rate is the odds of Tame succeeding after when the requiements are
 * met. If they're not, the MooseTame command won't even get to this point.
 * 
 * By default, the taming rate is 100, meaning it will always succeed (again,
 * provided the requirements are met). You can modify this value this way:
 * 
 * <Tame>
 *  rate: 80
 * </Tame>
 * 
 * Now we have a taming base rate of 80%.
 * 
 * When the plugin rolls the 1d100 die, Taming will work if the roll is inferior
 * or equal to the final rate. The rate can be further influenced with modifiers.
 *
 * # Taming bonuses
 *
 * These modifiers are notetags on actor classes, armors, and states, and they
 * all look like this:
 * 
 * <Tame>
 *  rate: +n
 * </Tame>
 * 
 * With n being the bonus you want to apply to the base rate.
 * Here are a few examples:
 * 
 * 1. You want a class to be better at taming that the others, then use this note
 * on that class.
 * 2. Sleeping enemies will be easier caught, right? Then use this note on the
 * sleep state (state bonus and state requirements are two different things!).
 * 3. You have a pheromone spray that adds a state to the actor, then add this
 * note to the "pheromoned" state.
 * 4. There is an accessory or armor that increases chances of taming? Then use
 * that note on this state as well. (equipment bonus and bait are two different
 * things!)
 * 
 * To sum up all that, let's say we have an enemy with a base 50 taming rate.
 * Our actor has the Beastmaster that gives +10 to the rate. They're wearing a
 * Hypnocrown accessroy that gives +8 to the rate, and under the "pheromoned"
 * state that gives +3.
 * The enemy is under the "Sleep" state that gives +5.
 * 
 * The final rate will there be 50 + 10 + 8 + 3 + 5 = 76.
 * 
 * So with the bonuses we need to roll 76 or less, up from 50.
 * 
 * On the contraty, if you want to define classes, states or equipments that
 * hinder taming, just give a negative value to n. Here are a few examples:
 * 
 * 1. Using an item that halves encounters, also gives a -50 rate.
 * 2. The enemy is enraged (berserk) state and cannot be tamed, give the state
 * a -100 (or -9000, go wild), so make the rate so low it's won't go through.
 * Keep in mind that if the base rate is 100 and you give the enraged state -100,
 * Additional bonus may still make the final rate above 0.
 * 
 * # Bait
 * 
 * Baits are special kinds of armor related bonuses. The difference between a
 * bait and a bonus armor are:
 * - the bait is consumed upon successful taming
 * - not all baits apply to every enemy
 * 
 * A bait needs to be configured in two places: in the enemy's note and in the
 * armor's note. Let's start with the enemy.
 * 
 * <Tame>
 *  bait: 4
 * </Tame>
 * 
 * This simply defines that if the actor has the bait with armor id 4 equipped,
 * the bonus defined in the bait wil apply. Enemy that don't react to bait 4
 * will not benefit from the bonus.
 * 
 * And now the bait note:
 * 
 * <Tame>
 *  baitBonus: 10
 * </Tame>
 * 
 * Enemies reacting to bait 4 will get a 10 bonus to their taming rate.
 * 
 * ------------------------------------------------------------------------------
 * Taming Outcome
 * ------------------------------------------------------------------------------
 * 
 * Outcomes come in two categories: the good ones on success and the bad ones
 * on failure.
 * 
 * There is only one outcome that will happen no matter what: when an enemy is
 * successfully tamed, it is removed from the battle and yields no XP, gold or
 * items.
 *
 * # Good: Skill learning
 * 
 * If you want to teach a new skill or more to your actor when a monster is
 * successfully tame, you can define this notetag on the enemy:
 * 
 * <Tame>
 *  skills: 5
 * </Tame>
 * 
 * If taming succeeds, the actor will learn skill number 5. Note that you can
 * define several skills in a comma-separated list. Ex: 5,6
 * 
 * # Good: Keep enemy to release later
 * 
 * You can also "keep" the enemy stored to release it later in battle. First,
 * you ned to create a skill that will be executed when the enemy is released,
 * and then configure the notetag of the enemy like this:
 * 
 * <Tame>
 *  release: 6
 * </Tame>
 * 
 * The you need to create a release skill. We'll call it "Release". It needs
 * to call a common event that call the plugin command "MooseTameRelease".
 * 
 * Using the Release skill without having tamed an enemy first will result
 * in nothing happening.
 * Taming an enemy with a release note will replace the enemy previously caught.
 * 
 * When using a release skill, it will target one random enemy. You will then
 * have to catch another enemy to use release again.
 * 
 * Releases are stored on a per-actor basis, so if you have several actors
 * capable of taming, they can each "store" their own enemy.
 * 
 * # Bad: Gaining state
 * 
 * If you want to define an enemy that doesn't like someone trying to tame them,
 * and want to add an enraged state to them when taming fails, add this note to
 * the enemy:
 *
 * <Tame>
 *  rate: 10
 *  onFailAddState: 7
 * </Tame>
 * 
 * If you attempt to tame this enemy and fail (the rate isn't mandatory here,
 * it's just to give an example that has an actual chance of failing), then the
 * enemy will gain state 7 (Rage in default RM MV).
 * 
 * # Bad: Losing state
 * 
 * You can also go the other way and clear state that benefit you when you fail
 * at taming an enemy. If you want an enemy to wake up when you fail at taming
 * it, use this note:
 * 
 * <Tame>
 *  rate: 10
 *  onFailRemoveState: 10
 * </Tame>
 * 
 * If you attempt to tame this enemy and fail (same thing for the rate), if the
 * enemy was sleeping (default state 10), it will wake up.
 * 
 * ------------------------------------------------------------------------------
 * 
 * To sum up, here is what a full notetag can look like:
 * 
 * <Tame>
 *  rate: 50
 *  hp: 15
 *  state: 5,10
 *  bait: 4,must
 *  skills: 15
 *  onFailAddState: 7
 *  onFailRemoveState: 10
 * </Tame>
 * 
 * To tame this enemy, you will have to:
 * - bring it under 15% of its max HP
 * - apply stated 5 (Blind) and 10 (Sleep) to it
 * - have your actor equipped with bait number 4
 * 
 * And only then you have a 50% of taming it (before bonuses).
 * 
 * If it succeeds, the actor will learn skill 15, and the enemy will be
 * removed from the battle.
 * If it fails, the enemy will lose state 10 and gain state 7.
 * 
 * ------------------------------------------------------------------------------
 * Parameters
 * ------------------------------------------------------------------------------
 * 
 * You can tweak the plugin to your likings with a few parameters:
 * 
 * Tame Success SE: configure the sound you want to play when taming succeeds
 * Tame Fail SE: configure the sound you want to play when taming fails
 * Tame Strings: translate the plugin's strings to your game's language.
 * 
 * When translating the strings, anything between double underscore is something
 * that will be replaced, so don't change those. For example, when an enemy
 * cannot be tamed, the default string is:
 *
 * "__enemy__ can't be tamed!"
 *
 * If you want to translate it and place the "__enemy__" placeholder where needed.
 *
 * ------------------------------------------------------------------------------
 * Terms of Use
 * ------------------------------------------------------------------------------
 * - Free for use in non-commercial projects with credits to MetaphoricalMoose :)
 * - Do not use in commercial projects
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

    	for(executable of configuration[tamingFailure]) {
    		executable(troopEnemy);
    	}

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
    	let skill = $dataSkills[value];

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
    	configuration[tamingFailure].push(function(enemy) {
    		let states = value.split(',').map(s => parseInt(s.trim()));

	    	for (state of states) {
	    		if (action === onTamingFailAddState) {
	    			enemy.addState(state);
	    		} else {
	    			enemy.removeState(state);
	    		}
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

    	return roll <= modifiedRate;
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
