import { events, IGameState, PlayerInfo } from "logstf-parser"
import { defaultPlaysIn } from "../DatabaseModelPrisma"
import { Prisma } from '@prisma/client'
import plays_inCreateManyLogs = Prisma.plays_inCreateManyLogsInput

interface IMedicStats {
    advantagesLost: number,
    biggestAdvantageLost: number,
    nearFullChargeDeaths: number,
    deathsAfterUber: number,
    avgTimeBeforeFirstHealing: number, //This refers to the time the medic takes to first heal someone after he spawns
    avgTimeToBuild: number,
    avgTimeToUse: number,
    avgUberLength: number
}

interface IInternalStats {
    timesBeforeHealing: number[],
    timesToBuild: number[],
    uberLengths: number[],
    timesBeforeUsing: number[],
    lastUsedTime: number,
    lastSpawnTime: number,
    lastTimeDamageTaken: number,
    lastChargeObtainedTime: number
}

interface IPlayerStats {
    team: string | null
    kills: number
    assists: number
    deaths: number
    damage: number
    suicides: number
    damageTaken: number
    charges: number
    chargesByType: { [index: string]: number }
    drops: number
    airshots: number
    sentriesBuilt: number
    sentriesDestroyed: number
    headshots: number
    headshotKills: number
    healing: number
    healingReceived: number
    medkits: number
    medkitsHp: number
    backstabs: number
    capturesPoint: number
    capturesIntel: number
    longestKillStreak: number
    currentKillStreak: number
    medicstats: IMedicStats | null
}

interface IClassStats {
    playtimeInSeconds: number
}

export class PlaysInModule implements events.IStats {
    public identifier: string
    private players: { [id: string]: IPlayerStats }
    private classes: Map<string, Map<string, IClassStats>>
    private internalStats: { [id: string]: IInternalStats }
    private gameState: IGameState
    private currentRoles: Map<string, string>
    private currentSpawntimes: Map<string, number>

    constructor(gameState: IGameState) {
        this.identifier = 'playsIn'
        this.players = {}
        this.classes = new Map<string, Map<string, IClassStats>>()
        this.internalStats = {}
        this.gameState = gameState
        this.currentRoles = new Map<string, string>()
        this.currentSpawntimes = new Map<string, number>()
    }

    private defaultClassStats = (): IClassStats => ({
        playtimeInSeconds: 0,
    })

    private defaultPlayer = (): IPlayerStats => ({
        team: null,
        kills: 0,
        assists: 0,
        deaths: 0,
        damage: 0,
        suicides: 0,
        damageTaken: 0,
        charges: 0,
        chargesByType: {},
        drops: 0,
        airshots: 0,
        sentriesBuilt: 0,
        sentriesDestroyed: 0,
        headshots: 0,
        headshotKills: 0,
        healing: 0,
        healingReceived: 0,
        medkits: 0,
        medkitsHp: 0,
        backstabs: 0,
        capturesPoint: 0,
        capturesIntel: 0,
        longestKillStreak: 0,
        currentKillStreak: 0,
        medicstats: null,
    })

    private defaultInternalStats = (): IInternalStats => ({
        timesBeforeHealing: [],
        timesToBuild: [],
        uberLengths: [],
        timesBeforeUsing: [],
        lastUsedTime: 0,
        lastSpawnTime: 0,
        lastChargeObtainedTime: 0,
        lastTimeDamageTaken: 0
    })

    private defaultMedicStats = (): IMedicStats => ({
        advantagesLost: 0,
        biggestAdvantageLost: 0,
        nearFullChargeDeaths: 0,
        deathsAfterUber: 0,
        avgTimeBeforeFirstHealing: 0,
        avgTimeToBuild: 0,
        avgTimeToUse: 0,
        avgUberLength: 0
    })

    private getClassStats(player: string, role: string): IClassStats {
        if (!this.classes.has(player)) {
            this.classes.set(player, new Map<string, IClassStats>())
        }
        const playerInstance = this.classes.get(player)!

        if (!playerInstance.has(role)) {
            playerInstance.set(role, this.defaultClassStats())
        }

        const returnInstance = playerInstance.get(role)!
        return returnInstance
    }

    private getMostPlayedClass(player: string): string {
        let mostPlayed: string = "NA"
        let mostPlaytime: number = 0
        this.classes.get(player)?.forEach((value, key) => {
            if (value.playtimeInSeconds >= mostPlaytime) {
                mostPlayed = key;
            }
        })
        return mostPlayed


    }

    private getMean(input: number[]): number {
        if (input.length != 0)
            return input.reduce((a, b) => a + b) / input.length
        return 0
    }

    private trackingStop(playerId: string, timestamp: number) {
        const currentRole = this.currentRoles.get(playerId)
        const currentSpawntime = this.currentSpawntimes.get(playerId)

        if (currentRole && currentSpawntime) {
            const oldRole = this.getClassStats(playerId, currentRole)
            oldRole.playtimeInSeconds += timestamp - currentSpawntime
            this.currentSpawntimes.delete(playerId)
        }
    }

    private getOrCreatePlayer(player: PlayerInfo): IPlayerStats {
        if (!(player.id in this.players)) {
            this.players[player.id] = this.defaultPlayer()
        }
        let playerInstance = this.players[player.id]
        if (!playerInstance) throw new Error()
        playerInstance.team = player.team
        return playerInstance
    }

    private getOrCreateStats(player: PlayerInfo): IInternalStats {
        if (!(player.id in this.internalStats)) {
            this.internalStats[player.id] = this.defaultInternalStats()
        }
        let playerInstance = this.internalStats[player.id]
        if (!playerInstance) throw new Error()
        return playerInstance
    }

    onKill(event: events.IKillEvent) {
        if (!this.gameState.isLive) return
        const attacker: IPlayerStats = this.getOrCreatePlayer(event.attacker)
        const victim: IPlayerStats = this.getOrCreatePlayer(event.victim)

        attacker.kills++
        attacker.currentKillStreak++

        if (event.headshot) attacker.headshots++
        if (event.backstab) attacker.backstabs++

        victim.deaths++
        victim.longestKillStreak = Math.max(victim.currentKillStreak, victim.longestKillStreak)
        victim.currentKillStreak = 0
    }

    onDamage(event: events.IDamageEvent) {
        if (!this.gameState.isLive) return
        const attacker: IPlayerStats = this.getOrCreatePlayer(event.attacker)
        attacker.damage += event.damage
        if (event.headshot) attacker.headshots += 1
        if (event.airshot) attacker.airshots += 1

        if (event.victim) {
            const victim: IPlayerStats = this.getOrCreatePlayer(event.victim)
            const stats: IInternalStats = this.getOrCreateStats(event.victim)
            if (victim) {
                victim.damageTaken += event.damage
            }
            stats.lastTimeDamageTaken = event.timestamp
        }
    }

    onCapture(event: events.ICaptureEvent) {
        if (!this.gameState.isLive) return
        for (const playerInfo of event.players) {
            const player: IPlayerStats = this.getOrCreatePlayer(playerInfo)
            player.capturesPoint += 1
        }
    }

    onFlag(event: events.IFlagEvent) {
        if (!this.gameState.isLive) return
        const player: IPlayerStats = this.getOrCreatePlayer(event.player)
        if (event.type == events.FlagEvent.Captured) {
            player.capturesIntel += 1
        }
    }

    onPickup(event: events.IPickupEvent) {
        if (!this.gameState.isLive) return
        const player: IPlayerStats = this.getOrCreatePlayer(event.player)
        if (event.healing) {
            player.medkitsHp += event.healing
            switch (event.item) {
                case ("medkit_medium"):
                    player.medkits += 2
                    break;
                case ("medkit_large"):
                    player.medkits += 4
                    break;
                default:
                    player.medkits += 1
                    break;
            }
        }
    }

    onHeal(event: events.IHealEvent) {
        if (!this.gameState.isLive) return
        const healer: IPlayerStats = this.getOrCreatePlayer(event.healer)
        const target: IPlayerStats = this.getOrCreatePlayer(event.target)
        healer.healing += event.healing
        target.healingReceived += event.healing


    }

    onFirstHeal(event: events.IFirstHealEvent) {
        if (!this.gameState.isLive) return
        const statsHealer: IInternalStats = this.getOrCreateStats(event.player)
        statsHealer.timesBeforeHealing.push(event.time)
    }

    onBuild(event: events.IBuildEvent) {
        if (!this.gameState.isLive) return
        if (event.builtObject == events.Building.Sentry) {
            const player: IPlayerStats = this.getOrCreatePlayer(event.player)
            player.sentriesBuilt += 1
        }
    }

    onObjectDestroyed(event: events.IObjectDestroyedEvent) {
        if (!this.gameState.isLive) return
        if (event.builtObject == events.Building.Sentry) {
            const player: IPlayerStats = this.getOrCreatePlayer(event.attacker)
            player.sentriesDestroyed += 1
        }
    }

    onAssist(event: events.IAssistEvent) {
        if (!this.gameState.isLive) return
        const assister: IPlayerStats = this.getOrCreatePlayer(event.assister)
        assister.assists += 1
    }

    onSuicide(event: events.ISuicideEvent) {
        if (!this.gameState.isLive) return
        const player: IPlayerStats = this.getOrCreatePlayer(event.player)
        player.deaths += 1
        player.suicides += 1
    }

    onSpawn(event: events.ISpawnEvent) {
        if (!this.gameState.isLive) return

        this.trackingStop(event.player.id, event.timestamp)

        this.currentRoles.set(event.player.id, event.role)
        this.currentSpawntimes.set(event.player.id, event.timestamp)

        const stats: IInternalStats = this.getOrCreateStats(event.player)
        stats.lastSpawnTime = event.timestamp
    }

    onRole(event: events.IRoleEvent) {
        if (!this.gameState.isLive) return
        this.trackingStop(event.player.id, event.timestamp)

        this.currentRoles.set(event.player.id, event.role)
        this.currentSpawntimes.set(event.player.id, event.timestamp)
    }

    onRoundEnd(event: events.IRoundEndEvent) {
        for (let playerId of this.currentRoles.keys()) {
            this.trackingStop(playerId, event.timestamp)
        }
    }

    onDisconnect(event: events.IDisconnectEvent) {
        this.trackingStop(event.player.id, event.timestamp)
    }

    onJoinTeam(event: events.IJoinTeamEvent) {
        if (event.newTeam === 'Spectator') {
            this.trackingStop(event.player.id, event.timestamp)
        }
    }
    //Medic specific events
    onCharge(event: events.IChargeEvent) {
        if (!this.gameState.isLive) return
        const player: IPlayerStats = this.getOrCreatePlayer(event.player)
        const stats: IInternalStats = this.getOrCreateStats(event.player);
        player.charges += 1
        if (!(event.medigunType in player.chargesByType)) {
            player.chargesByType[event.medigunType] = 0
        }
        player.chargesByType[event.medigunType] += 1
        stats.timesBeforeUsing.push(event.timestamp - stats.lastChargeObtainedTime)
    }

    onChargeReady(event: events.IChargeReadyEvent) {
        if (!this.gameState.isLive) return
        const stats: IInternalStats = this.getOrCreateStats(event.player)
        stats.lastChargeObtainedTime = event.timestamp
        stats.timesToBuild.push(event.timestamp - Math.max(stats.lastUsedTime, stats.lastSpawnTime))
    }

    onLostUberAdv(event: events.ILostUberAdvantageEvent) {
        if (!this.gameState.isLive) return
        const player: IPlayerStats = this.getOrCreatePlayer(event.player)
        if (!player.medicstats) {
            player.medicstats = this.defaultMedicStats()
        }
        player.medicstats.advantagesLost += 1
        player.medicstats.biggestAdvantageLost = Math.max(player.medicstats.biggestAdvantageLost, event.time)
    }

    onMedicDeath(event: events.IMedicDeathEvent) {
        if (!this.gameState.isLive) return
        const attacker: IPlayerStats = this.getOrCreatePlayer(event.attacker)
        const victim: IPlayerStats = this.getOrCreatePlayer(event.victim)
        const stats: IInternalStats = this.getOrCreateStats(event.victim)
        if (event.isDrop)
            victim.drops += 1;
        if (event.timestamp - stats.lastUsedTime <= 20) {
            if (!victim.medicstats) {
                victim.medicstats = this.defaultMedicStats()
            }
            victim.medicstats.deathsAfterUber += 1;
        }

    }

    onMedicDeathEx(event: events.IMedicDeathExEvent) {
        if (!this.gameState.isLive) return
        const player: IPlayerStats = this.getOrCreatePlayer(event.player)
        if (!player.medicstats) {
            player.medicstats = this.defaultMedicStats()
        }
        if (event.uberpct >= 95 && event.uberpct < 100) {
            player.medicstats.nearFullChargeDeaths += 1
        }
    }

    onChargeEnded(event: events.IChargeEndedEvent) {
        if (!this.gameState.isLive) return
        const player: IPlayerStats = this.getOrCreatePlayer(event.player)
        const stats: IInternalStats = this.getOrCreateStats(event.player);
        if (!player.medicstats) {
            player.medicstats = this.defaultMedicStats()
        }
        stats.lastUsedTime = event.timestamp;
        stats.uberLengths.push(event.duration);
    }

    finish(): void {
        const self = this;
        for (const key of Object.keys(this.players)) {
            const player = self.players[key];
            const stats = self.internalStats[key]
            if (!stats || !player) return
            if (player.medicstats && stats) {
                player.medicstats.avgUberLength = self.getMean(stats.uberLengths)
                player.medicstats.avgTimeToBuild = self.getMean(stats.timesToBuild)
                player.medicstats.avgTimeToUse = self.getMean(stats.timesBeforeUsing)
                player.medicstats.avgTimeBeforeFirstHealing = self.getMean(stats.timesBeforeHealing)
            }
        }
    }

    toJSON(): plays_inCreateManyLogs[] {
        const mysqlPlaysIn: plays_inCreateManyLogs[] = []
        for (const key in this.players) {
            const player = this.players[key];
            const mysqlPlayer = defaultPlaysIn()
            try {
                mysqlPlayer.steam64 = BigInt(key);
                mysqlPlayer.kills = player.kills
                mysqlPlayer.assists = player.assists
                mysqlPlayer.deaths = player.deaths
                if (player.team == "blue") {
                    mysqlPlayer.blue = true
                }
                mysqlPlayer.damage = player.damage
                mysqlPlayer.damageTaken = player.damageTaken
                mysqlPlayer.drops = player.drops
                mysqlPlayer.class = "scout"
                for (const chargeName in player.chargesByType) {
                    const charge = player.chargesByType[chargeName]
                    if (chargeName == "kritzkrieg") {
                        mysqlPlayer.kritz = charge
                    }
                    else if (chargeName == "medigun") {
                        mysqlPlayer.ubers += charge
                    }
                    else {
                        // console.info("Found unknow charge named: " + chargeName)
                        mysqlPlayer.ubers += charge
                    }
                }
                mysqlPlayer.healsDistributed = player.healing
                mysqlPlayer.healsReceived = player.healingReceived
                mysqlPlayer.class = this.getMostPlayedClass(key)
                mysqlPlaysIn.push(mysqlPlayer);
            }
            catch (err) {
                continue;
            }
        }
        return mysqlPlaysIn
    }

}