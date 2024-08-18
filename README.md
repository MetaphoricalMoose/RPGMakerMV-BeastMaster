# Beastmaster plugin for RPG Maker MV

Welcome! 

This humble plugin for RPG Maker MV and adds a taming feature to your project.

It is partially inspired of the Beastmaster job in Final Fantasy V (Catching / Releasing monsters).

## Features

The plugin lets you mark enemies as tamable by adding a notetag to their note. There are several parameters you can adjust per monster, most falling into either category: requirements and outcomes.

To showcase these features, two examples will follow, one for a tamable monster, one for a releasable monster.

Please note that none of these parameters are mutually exclusive, you can for example have an enemy that is both tamable (= teaches a skill permanently) and releasable (triggers a skill when the Release skill is used).

(You can of course soft-lock the taming yourself if for example you define a required state that also gives a -100 penalty to taming without giving the player the tools to make this rate achievable.)

## Requirements

Requirements are a set of conditions that must **all** be met to go forth with a taming attempt. Should one be missing, the taming attempt fails automatically.

Here is a list of what can be defined as a requirement:

**Percentage of max HP**

*Parameter name: hp*

This parameter defines the HP range in which the enemy can be tamed. Two formats are accepted:
* `n`: the enemy must be within 0% and n% of its max HP to be tamed (the first format is a shortcut for `0-n`).
* `n-m`: the enemy must be within n% and m% of its max HP to be tamed.

**Afflicted by states**

*Parameter name: states*

This parameter defines states that the enemy must be afflicted with for a taming attempt to succeed. Use the state's id to define either one (`states: n`) or several states (`states: n,m`)

**Bait**

*Parameter name: bait*

This parameter defines armors that are considered bait for the enemy. Use the armor's id to mark is as "bait compatible with this enemy". Imagine the following enemy notetag:

```
<Tame>
  bait: 3,4,5,must
</Tame>
```

This note defines armors with ids 3, 4 and 5 as bait compatible with this enemy. The *must* keyword marks it as a requirement. Without the *must* keyword, not having the bait equipped wouldn't fail the taming attempt. More on bait further.

## Outcomes

Outcomes are parameters that define what happens when an actor tries to tame an enemy, and are also listed in the enemy's notetag along with the requirements. One outcome will always happen when an enemy is successfully tamed: it is removed from the battle instantly (under the hood, it's forced into running away, so no XP, gold or loot).

**Learn a skill (or more) permanently**

*Parameter name: skills*

Use skill ids to define skills the actor will learn upon successful taming. Example:
* `skills: n`: Learns skill n
* `skills: n-m`: Learns skill n and m

**Learn a skill for single usage**

*Parameter name: release*

Use skill ids to define skills the actor will learn upon successful taming. The difference withe the topic above is that this skill will be accessed using the "Release" (more on skill configuration further). It accepts only one skill id.
* `release: n`: Learns skill n for release.

**Gains new state on taming failure**

*Parameter name: onFailAddState*

This parameter lists the ids of states to add to the enemy in case of failed taming attempts. Use cases include and enemy who enrages (+Rage state) after failed taming attempt; or an enemy that gets a state that prevent taming for the next n turns (see Rate bonuses further). It accepts one or more state ids.
* `onFailAddState: n`: Gains state n
* `onFailAddState: n, m`: Gains state n and m

**Loses state on taming failure**

*Parameter name: onFailRemoveState*

Same as above, but states are moved instead of added. Use cases include an enemy who wakes up (-Sleep state) after a failed taming attempt. It accepts one or more state ids.
* `onFailRemoveState: n`: Gains state n
* `onFailRemoveState: n, m`: Gains state n and m

## Rate bonuses

There is one more enemy notetag configuration item is that is neither a requirement or an outcome. By default, if the requirements are all met, an enemy will be tamed 100% of the time. If you want to tweak that and add some RNG, you can define a base rate with the *rate* parameter. It accepts any integer value, but keep in mind that: 

- a rate of 100 or more will always succeed unless some modifiers lower the final rate.
- a rate of 0 or less will always fail unless some modifiers increase the final rate.

Modifiers are notetags you can place in actor's classes, amors, and states (both actor and enemy). They all look like this:
```
<Tame>
  rate: +n
</Tame>
```

Some use cases:
- Class note: You can use those to make taming easier on a given class (ex: Rangers don't get any native bonuses, but Beastmasters have a +10 bonus)
- Armor note: A magic ring that gives a bonus to taming.
- State note: A sleeping enemy should be easier to tame, right? And the actor can have a state that increase the rate (ex: Charming)

When all the requirements are met, the plugin will compute the final rate as:

```
final rate = enemy's base rate + class modifier + armor modifiers + actor's states modifiers + enemy's states modifiers
```

Then it will roll a 1d100 and if the result it inferior or equal to the final rate, then it's a success.

Please note that a state with a rate modifier doesn't make it a requirement. States define their own bonuses, but only the enemy notetag can define the requirements.

Also, you can define negative modifiers. For example, a monster repellent accessory will halve the encounter rate, but also with a -50 rate modifier for taming.

## Bait

Baits are pieces of armor with a special notetag:
```
<Tame>
  baitBonus: 15
</Tame>
```

There are some key difference between a bait and an armor with a rate bonus:

- Baits are effective only on enemies that define them as compatible bait (see the requirement section). If not listed, then the baitBonus has 0 impact on the rate.
- Upon successful taming, baits are consumed (= unequipped and not returned to inventory).

Baits aren't required unless the enemy notetag includes the "must" keyword. If not, the bait is just consumable rate bonus.

## 1st Example: Tamable enemy

```
<Tame>
  rate: 40
  hp: 30
  states: 4,6
  bait: 3, must
  skills: 14
  onFailAddState: 5
  onFailRemoveState: 7,8
</Tame>
```

To tame this enemy, all the following conditions must be met:

- the enemy is at 30% or less of its max HP
- the enemy is affected by states 4 and 6
- the actor is equipped with armor number (3) (doesn't matter in which slot)

If all of those are checked, the plugin will compute the final rate (here, 30 + modifiers) and roll a 1d100.

If the roll is inferior or equal to the final rate, then the success outcomes take place. Here:

- the enemy is removed from the battlefield
- the actor learns skill with id 14

On the other hand, if the roll is superior to the final rate:

- the enemy loses states 7 and 8
- the enemy gains state 5

## 2nd Example: Release enemy

```
<Tame>
  rate: 50
  hp: 80-90
  bait: 4
  relase: 15
</Tame>
```

To get this enemy as release skill, the following condition must be met:

- the enemy is within 80% and 90% of its max HP

If is it checked, the plugin will compute the final rate (here, 50 + modifiers like bait 4 equipped) and roll a 1d100.

If the roll is inferior or equal to the final rate, then the success outcomes take place. Here:

- the enemy is removed from the battlefield
- the actor's release skill will trigger skill 15 when used.

On the other hand, if the roll is superior to the final rate, then nothing else than a failure message happens.

## Skills configuration

To create the **Tame** skill (target: one enemy), you need to make the skill call a common event, and make this common event run the following plugin command:
```
MooseTame
```

That's it. Everything else happens in the notetags.

To create the **Release** skill (target doesn't matter, releasing an enemy will always target a random enemy), same thing, call a common event that call a plugin command:
```
MooseTameRelease
```

A few additional notes on Release:

- If you use Release before you have tamed anything, it will output a message to tell you that you haven't tamed anything
- If you Tame an enemy that gives a release skill when you already have one, the newer one will replace the older one
- If you use Release when you have a release enemy ready, then it will trigger the skill you configured in that enemy's notetag.
- Implementing a Release skill is entirely optional if you don't have any release enemies.

## Localization

If English isn't the language of your game or if you want to tweak the strings used in the plugin, you can edit any of them in the plugin's configuration under the "Strings" parameter.

Please note that the placeholders between double underscores should **not** be translated.

Ex: `__actor__ tamed a __enemy__!`

Should **not** be translated to `__attore__ ha domato un __nemico__!` but to `__actor__ ha domato un __enemy__!` (powered by Google Translate).

## Demo project

This repo includes a demo project to showcase how to set up and use the plugin.

## Terms of use

Free to use in your non-commercial projects, with credit to MetaphoricalMoose :)
Please don't use in commercial projects.

## Changlog

* Version: 1.0: Initial Release
