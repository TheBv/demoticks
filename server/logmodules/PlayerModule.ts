import { events, IGameState, PlayerInfo } from "logstf-parser";
import { defaultMysqlPlayer, IMysqlPlayer } from "../DatabaseModel";
import SteamID = require('steamid');



export class PlayerModule implements events.IStats {
    public identifier: string
    private players: IMysqlPlayer[]
    private gameState: IGameState
    constructor(gameState: IGameState) {
        this.identifier = 'players'
        this.players = []
        this.gameState = gameState
    }

    private addPlayer(player: PlayerInfo){
        if (!this.players.find(p => p.steamId3 == player.id)){
            const newPlayer = defaultMysqlPlayer();
            newPlayer.steamId3 = player.id
            const steamId = new SteamID(player.id)
            newPlayer.steam64 = steamId.getSteamID64();
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
    
    finish(){}

    toJSON(): IMysqlPlayer[]{
        return this.players;
    }
}