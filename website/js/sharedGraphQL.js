var players = [];

class SearchQuery {
    attackers = []; //array of steamIds
    victims = []; //array of steamIds
    logIds = []; //array of logIds
    events = [];
    constructor(attackers = [null], victims = [null], logIds = [null], events = [null]) {
        this.attackers = attackers;
        this.victims = victims;
        this.logIds = logIds;
        this.events = events;
    }
    setAttackers(attackers) {
        this.attackers = attackers;
    }
    setVictims(victims) {
        this.victims = victims;
    }
    setLogIds(logIds) {
        this.logIds = logIds;
    }
    setEvents(events) {
        this.events = events;
    }
    toQuery() {
        let query = `{event(logid: [${this.logIds}]`;

        let queryInput = "";
        let queryOutput = "";
        if (!this.attackers.includes(null)) {
            queryInput += `attacker: "${this.attackers.join(`", "`)}"`;
        }
        if (!this.victims.includes(null)) {
            queryInput += `victim: ["${this.victims.join(`", "`)}"]`;
        }
        for (event of this.events) {
            queryInput += event.toInput();
            queryOutput += event.toOutput();
        }
        query += `events:{${queryInput}}) { logid date events{ attacker ${queryOutput} tick }}}`;
        console.log(query);
        return query;
    }
}

class Event {
    EventsI = new Map(Object.entries({
        KS: "killstreak : 3",
        HS: "headshot : true",
        AS: "airshot : true",
        MD: "medicDrop : true",
        BS: "backstab : true",
        MK: "medicDeath : true",
        K : "kill : true"
    }));
    EventsO = new Map(Object.entries({
        KS: "killstreak",
        HS: "headshot",
        AS: "airshot",
        MD: "medicDrop",
        BS: "backstab",
        MK: "medicDeath",
        K: "kill"
    }));
    subEvents = []

    add(eventTag) {
        this.subEvents.push(eventTag);
    }
    toInput() {
        let input = "";
        for (const eventTag of this.subEvents) {
            input += ` ${this.EventsI.get(eventTag)} `;
        }
        if (this.subEvents.length >= 2) {
            return ` andEvents: {${input}} `;
        }
        return input;
    }
    toOutput() {
        let output = "";
        for (const eventTag of this.subEvents) {
            output += ` ${this.EventsO.get(eventTag)} `;
        }
        return output;
    }
    getAlias() {
        return this.subEvents.toString().replaceAll(",", "");
    }
    matches(response) {
        let matches = true;
        for (const eventTag of this.subEvents) {
            if (response[this.EventsO.get(eventTag)] !== true) {
                matches = false;
            }
            if (typeof response[this.EventsO.get(eventTag)] == 'number') {
                matches = response[this.EventsO.get(eventTag)];
            }
        }
        return matches;
    }
}


const getPlayers =function() { //Needs updating
    return new Promise(function (resolve, reject) {
        let playerarray = [];
        let table = $("#playerTable").children("tbody")[0];
        new Promise(function (resolve, reject) {
            let promises = [];
            $.each(table.rows, function (player) {
                let checkagainst = "";
                if (players[player] !== undefined){
                    checkagainst = players[player].steam64;
                }
                if (table.rows[player].cells[0].getElementsByTagName("input")[0].value !== checkagainst) {
                    promises.push(queryData("{player(steam64: \"" + table.rows[player].cells[0].getElementsByTagName("input")[0].value + "\") {steam64 etf2lName steamId3}}").then(function (data) {
                        playerarray.push(data.player[0]);
                    }).catch((err) => { console.log("Invalid SearchInput",err); }));
                }
                else if (players[player] !== undefined) {
                    playerarray.push(players[player]);
                }
            });
            Promise.all(promises).then(function () {
                resolve();
            });
        }).then(function () {
            players = playerarray;
            resolve(playerarray);
        });
    });
};
//Returns the playername from a given steamid3
const getPlayerName = function(steamId3) { //Will be replaced with global player class
    for (const player of players) {
        if (player.steamId3 === steamId3){
            return player.name;
        }
    }
    return null;
};

const getPlayerNameFromSteam64 = function(_this) {
    if (_this.value.length === 17) {
        const cubes = $('div[name="requestingPlayerName"]');
        const name = _this.parentNode.parentNode.getElementsByTagName("td")[2].getElementsByTagName("input")[0];
        const querry = `{player(input: { steam64: "${_this.value}" }) {etf2lName}}`;
        cubes.show();
        queryData(querry).then(function (data) {
            if (data["player"].length !== 0) {
                name.value = data["player"][0]["etf2lName"];
                cubes.hide();
            }

        }).catch(reason => { name.value = "Player not found"; cubes.hide(); });
    }
}

function insertSteamId(_this) {
    const name = _this.value;
    const steamIdNeighbour = _this.parentNode.parentNode.getElementsByTagName("td")[0].getElementsByTagName("input")[0];
    if (returnedPlayers.length !== undefined) {
        for (const data of returnedPlayers) {
            if (data["etf2lName"] === name){
                steamIdNeighbour.value = data["steam64"];
            }
        }
    }
}
/*async function steam64ToSteam3(steam64Array) {
    const steam3Array = [];
    for (const steam64 of steam64Array) {
        for (const player in players) {
            if (players[player].steam64 === steam64) {
                steam3Array.push(`"${players[player].steamId3.toString()}"`);
            }
        }
    }
    return steam3Array;
}*/

const updateDatalist = function(_this) { //Needs updating
    if (_this.value.length >= 2) {
        let querry = `{player(etf2lName: "${_this.value}" ) {steam64 etf2lName}}`;
        queryData(querry).then(function (data) {
            console.log(data);
            data = data["player"];
            if (data !== null) {
                let list = $("#playernames")[0];//_this.parentNode.getElementsByTagName("datalist")[0];
                returnedPlayers = new Object(); //This isn't useless returnedPlayers is a var in search (Do need to change that though)
                returnedPlayers = data;
                list.innerHTML = "";
                let names = [];
                for (let index in data) {
                    let option = document.createElement("option");
                    let name = data[index]["etf2lName"];
                    if (!names.includes(name)) {
                        names.push(data[index]["etf2lName"]);
                        option.value = name;
                    }
                    else {
                        let newName = data[index]["etf2lName"] + "(" + names.filter(i => i === name).length + ")";
                        names.push(newName);
                        data[index]["etf2lName"] = newName;
                        option.value = newName;
                    }
                    list.appendChild(option);
                }
            }
        });
    }
}

const addEvents = function(logs, chunkSize, callbackFunction = function () {}) { //Use async/await
    return new Promise(function (resolve, reject) {
        try {
            const chunks = chunkArray(logs, chunkSize);
            new Promise(function (resolve, reject) {
                const promises = [];
                for (const chunk of chunks) {
                    const query = `{addLog(logid: [${chunk.toString()}] )}`;
                    console.log(query);
                    promises.push(queryData(query).then(function () {
                        callbackFunction(chunk.length, 1);
                    }));
                }
                Promise.all(promises).then(function () {
                    resolve();
                });
            }).then(function () {
                resolve();
            });
        }
        catch (err) {
            reject(err);
        }
    });
}
