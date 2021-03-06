import axiosRetry, { isNetworkError } from 'axios-retry';
import axios from 'axios'
const jsdom = require('jsdom');
import SteamID from "steamid";
import { players } from "@prisma/client";
const { JSDOM } = jsdom;
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay, retryCondition: isNetworkError })

export async function fetchNames(players: players[]): Promise<players[]> {
    const playerPromises: Promise<players>[] = []
    for (const player of players) {
        playerPromises.push(setPlayerNames(player))
    }
    await Promise.allSettled(playerPromises);
    return players;
}

export async function fetchName(player: players): Promise<players> {
    await setPlayerNames(player);
    return player;
}

async function setPlayerNames(player: players): Promise<players> {
    const steam64 = player.steam64
    try {
        player.etf2lName = await getEtf2lName(steam64).catch((err) => { return null });
        //TODO:
        //player.ozFortressName = await getOZFortressName(steam64);
        player.ugcName = await getUGCName(steam64).catch((err) => { return null });
        player.logstfName = await getLogstfName(steam64).catch((err) => { return null });
        player.name = player.etf2lName || player.ugcName || player.logstfName;
    }
    catch (err) {
        console.error(err);
    }
    return player
}

async function getEtf2lName(steam64: BigInt): Promise<string> {
    const result = await axios.get(`https://api.etf2l.org/player/${steam64}.json`);
    return result.data.player.name
}

async function getOZFortressName(steam64: BigInt): Promise<string> {
    const result = await axios.get(`https://ozfortress.com/users?q=${steam64}`);
    const dom = new JSDOM(result.data.toString())
    return dom.window.document.getElementsByClassName("row slim-gutter")[0].getElementsByTagName("a")[0].textContent;
}

async function getUGCName(steam64: BigInt): Promise<string> {
    const result = await axios.get(`https://www.ugcleague.com/players_page.cfm?player_id=${steam64}`);
    const dom = new JSDOM(result.data.toString())
    const name = dom.window.document.getElementById("wrapper").getElementsByClassName("container")[1].getElementsByClassName("row-fluid")[0]
        .getElementsByClassName("row")[0].getElementsByClassName("col-md-12")[0].getElementsByClassName("white-row-small clearfix")[0]
        .getElementsByClassName("row-fluid")[0].getElementsByClassName("col-md-4")[0].getElementsByTagName("h3")[0].getElementsByTagName("b")[0].innerHTML;
    return name
}

async function getLogstfName(steam64: BigInt): Promise<string | null> {
    const result = await axios.get(`https://logs.tf/profile/${steam64}`);
    const dom = new JSDOM(result.data.toString())
    const name = dom.window.document.getElementsByClassName("log-header")[0].getElementsByTagName("h3")[0].textContent.toString();

    if (name === new SteamID(steam64.toString()).getSteam3RenderedID()) {
        return null
    }
    else {
        return name;
    }
}