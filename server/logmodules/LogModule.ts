
import { events } from "logstf-parser";
import { IGameState, PlayerInfo } from "logstf-parser";
import { defaultLog } from "../DatabaseModelPrisma";
import { logs as IMysqlLog } from '@prisma/client'


interface IPlayerStats {
    team: string | null
    kills: number
    dmg: number
}

interface ITeamRoundStats {
    score: number
    kills: number
    dmg: number
    ubers: number
}

interface Round {
    lengthInSeconds: number
    firstCap: string
    winner: events.Team | null
    team: { Blue: ITeamRoundStats, Red: ITeamRoundStats }
    events: Array<any>
    players: { [id: string]: IPlayerStats }
}

export class LogModule implements events.IStats {
    public identifier: string
    private gameState: IGameState
    private rounds: Round[]
    private currentRoundPlayers: { [id: string]: IPlayerStats }
    private currentRoundEvents: Array<any>
    private currentRoundTeams: { Blue: ITeamRoundStats, Red: ITeamRoundStats }
    private currentRoundStartTime: number
    private currentRoundPausedStart: number
    private currentRoundPausedTime: number
    private totalLengthInSeconds: number
    private firstCap: string
    private mysqlLog: IMysqlLog
    private gameStartTime: number
    private paused: boolean

    constructor(gameState: IGameState) {
        this.identifier = 'game'
        this.gameState = gameState
        this.currentRoundStartTime = 0
        this.currentRoundPausedStart = 0
        this.currentRoundPausedTime = 0
        this.currentRoundEvents = []
        this.currentRoundTeams = { Blue: this.defaultTeamStats(0), Red: this.defaultTeamStats(0) }
        this.currentRoundPlayers = {}
        this.firstCap = ""
        this.totalLengthInSeconds = 0
        this.rounds = []
        this.gameStartTime = 0
        this.mysqlLog = defaultLog()
        this.paused = false
    }

    private defaultTeamStats = (score: number): ITeamRoundStats => ({
        score: score,
        kills: 0,
        dmg: 0,
        ubers: 0
    })

    private defaultPlayer = (): IPlayerStats => ({
        team: null,
        kills: 0,
        dmg: 0,
    })

    private getOrCreatePlayer(player: PlayerInfo): IPlayerStats {
        if (!(player.id in this.currentRoundPlayers)) {
            this.currentRoundPlayers[player.id] = this.defaultPlayer()
        }
        let playerInstance = this.currentRoundPlayers[player.id]
        if (!playerInstance) throw new Error()
        playerInstance.team = player.team
        return playerInstance
    }

    private newRound(timestamp: number) {
        if (this.rounds.length == 0) {
            this.gameStartTime = timestamp
        }
        this.currentRoundEvents = []
        this.currentRoundStartTime = timestamp
        this.currentRoundPausedTime = 0
        this.currentRoundPausedStart = 0
        this.gameState.isLive = true
        this.currentRoundTeams = { Blue: this.defaultTeamStats(this.currentRoundTeams.Blue.score), Red: this.defaultTeamStats(this.currentRoundTeams.Red.score) }
        this.firstCap = ""
        this.currentRoundPlayers = {}
    }

    private endRound(timestamp: number, winner: events.Team | null) {
        if (this.gameState.isLive === false) return
        this.gameState.isLive = false
        const roundLength = timestamp - this.currentRoundStartTime - this.currentRoundPausedTime
        if (roundLength < 1) return
        if (winner) {
            this.currentRoundEvents.push({
                type: "round_win",
                time: roundLength,
                team: winner
            })
        }
        this.rounds.push({
            lengthInSeconds: roundLength,
            firstCap: this.firstCap,
            winner: winner,
            events: this.currentRoundEvents,
            players: this.currentRoundPlayers,
            team: this.currentRoundTeams
        })
        this.totalLengthInSeconds += roundLength
    }

    private getLastRound(): Round {
        return this.rounds[this.rounds.length - 1]
    }

    onKill(event: events.IKillEvent) {
        if (!this.gameState.isLive) return
        const attacker: IPlayerStats = this.getOrCreatePlayer(event.attacker)
        attacker.kills += 1
        if (attacker.team == events.Team.Blue) {
            this.currentRoundTeams.Blue.kills += 1
        }
        if (attacker.team == events.Team.Red) {
            this.currentRoundTeams.Red.kills += 1
        }
    }

    onDamage(event: events.IDamageEvent) {
        if (!this.gameState.isLive) return
        const attacker: IPlayerStats = this.getOrCreatePlayer(event.attacker)
        attacker.dmg += event.damage
        if (attacker.team == events.Team.Blue) {
            this.currentRoundTeams.Blue.dmg += event.damage
        }
        if (attacker.team == events.Team.Red) {
            this.currentRoundTeams.Red.dmg += event.damage
        }
    }

    onScore(event: events.IRoundScoreEvent) {
        const lastRound = this.getLastRound()
        if (!lastRound) return
        if (event.team == events.Team.Red) {
            this.currentRoundTeams.Red.score = event.score
        } else if (event.team == events.Team.Blue) {
            this.currentRoundTeams.Blue.score = event.score
        }
    }

    onRoundStart(event: events.IRoundStartEvent) {
        this.newRound(event.timestamp)
    }

    onMiniRoundStart(event: events.IRoundStartEvent) {
        this.newRound(event.timestamp)
    }

    onRoundEnd(event: events.IRoundEndEvent) {
        this.endRound(event.timestamp, event.winner)
        // Workaround for the case that the "Game_Over" event triggers before the "Round_Win" event
        if (!this.gameState.isLive) {
            const roundLength = event.timestamp - this.currentRoundStartTime - this.currentRoundPausedTime
            const lastRound = this.getLastRound()
            // Check to make sure the round_win event happened at the same time as
            // the previous event that ended the round
            if (lastRound.winner) return
            if (lastRound.lengthInSeconds !== roundLength) return
            lastRound.events.push({
                type: "round_win",
                time: roundLength,
                team: event.winner
            })
            lastRound.winner = event.winner
        }
    }

    onGameOver(event: events.IGameOverEvent) {
        this.endRound(event.timestamp, null)
    }

    onPause(event: events.IPauseEvent) {
        if (this.gameState.isLive) {
            this.gameState.isLive = false
            this.paused = true
            this.currentRoundPausedStart = event.timestamp
        }
    }

    onUnpause(event: events.IUnpauseEvent) {
        if (this.paused) {
            this.gameState.isLive = true
            this.paused = false
            if (this.currentRoundPausedStart > 0 && event.timestamp > this.currentRoundPausedStart) {
                this.currentRoundPausedTime += event.timestamp - this.currentRoundPausedStart
                this.currentRoundPausedStart = 0
            }
        }
    }
    // Added to fix pause/unpause desync issues 
    onTriggered(event: events.ITriggeredEvent) {
        if (this.gameState.isLive) return
        if (!this.paused) return
        this.onUnpause({
            timestamp: event.timestamp
        })
    }

    onMapLoad(event: events.IMapLoadEvent) {
        this.gameState.mapName = event.mapName
    }

    onFlag(event: events.IFlagEvent) {
        if (!this.gameState.isLive) return
        const time = event.timestamp - this.currentRoundStartTime
        this.currentRoundEvents.push({
            type: event.type,
            time: time,
            steamid: event.player.id,
            team: event.player.team
        })
    }

    onCapture(event: events.ICaptureEvent) {
        if (!this.gameState.isLive) return
        const time = event.timestamp - this.currentRoundStartTime
        if (this.currentRoundEvents.filter(evt => evt.type == 'capture').length == 0) {
            this.firstCap = event.team;
        }
        this.currentRoundEvents.push({
            type: 'pointcap',
            timeInSeconds: time,
            team: event.team,
            pointId: event.pointId,
            playerIds: event.players.map(player => player.id)
        })
    }

    finish() {
        this.mysqlLog.bluePoints = this.getLastRound().team.Blue.score
        this.mysqlLog.redPoints = this.getLastRound().team.Red.score
        this.mysqlLog.date = this.gameStartTime + this.totalLengthInSeconds
        this.mysqlLog.timeTaken = this.totalLengthInSeconds
        //Get the round with the most players and use that round's players as the max playeramount
        this.mysqlLog.playeramount = Object.values(this.rounds.reduce((a, b) => {
            if (Object.values(a.players) > Object.values(b.players)) {
                return a
            }
            return b
        }).players).length;

    }

    toJSON(): IMysqlLog {
        return this.mysqlLog;
    }
}