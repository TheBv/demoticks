import { events, IGameState, PlayerInfo } from "logstf-parser";
import { defaultPlayer } from "../DatabaseModelPrisma";
import { players as IMysqlPlayer, Prisma } from '@prisma/client'


export class PlayerModule implements events.IStats {
    public identifier: string
    private players: IMysqlPlayer[]
    private gameState: IGameState
    constructor(gameState: IGameState) {
        this.identifier = 'players'
        this.players = []
        this.gameState = gameState
    }

    private addPlayer(player: PlayerInfo) {
        const playerId = BigInt(player.id)
        if (!this.players.find(p => p.steam64 == playerId)) {
            const newPlayer = defaultPlayer();
            newPlayer.steam64 = playerId
            this.players.push(newPlayer)
        }
    }

    onSpawn(event: events.ISpawnEvent) {
        if (!this.gameState.isLive) return
        this.addPlayer(event.player)

    }

    onRole(event: events.IRoleEvent) {
        if (!this.gameState.isLive) return
        this.addPlayer(event.player)
    }

    onDisconnect(event: events.IDisconnectEvent) {
        this.addPlayer(event.player)
    }

    onJoinTeam(event: events.IJoinTeamEvent) {
        this.addPlayer(event.player)
    }

    finish() { }

    toJSON(): IMysqlPlayer[] {
        return this.players;
    }
}