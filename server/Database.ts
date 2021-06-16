const mysql = require("mysql");
const config = require("./config");
const request = require("request");
const JSZip = require("jszip");
const fs = require("fs");
const requestRetry = require("requestretry");


const pool = mysql.createPool({
    connectionLimit: config.connectionLimit,
    host: config.MySQLHost,
    port: config.MySQLPort,
    user: config.MySQLUser,
    password: config.MySQLPassword,
    database: config.MySQLdatabase
});
function requestPromise(url : String) {
    return new Promise(function (resolve, reject) {
        try {
            requestRetry({
                url: url,
                maxAttempts: 100,
                retryDelay: 1000,
                retryStrategy: retryStrategy
            }, function (error, response, body) {
                if (response && response.statusCode === 200) {
                    resolve(body);
                }
                else {
                    reject(error);
                }
            });
        }
        catch (error){
            reject(error);
        }
    });
}
function requestPromiseJson(url: String) {
    return new Promise(function (resolve, reject) {
        try {
            requestRetry({
                url: url,
                json: true,
                maxAttempts: 100,
                retryDelay: 1000,
                retryStrategy: myJSONRetryStrategy
            }, function (error, response, body) {
                if (response && response.statusCode === 200) {
                    resolve(body);
                }
                else {
                    reject(error);
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
}
function retryStrategy(err, response) {
    return !!err || (response.statusCode >= 300 && response.statusCode < 500) || response.statusCode > 500;
}
function myJSONRetryStrategy(err, response, body) {
    if (typeof body !== "object") {
        return true;
    }
    return !!err || (response.statusCode >= 300 && response.statusCode < 500) || response.statusCode > 500;
}

function executeQuery(queryStatement, values = null) { //Creates and issues a generic MySQL Query
    return new Promise(function (resolve, reject) {
        pool.getConnection(function (err, connection) {
            if (err) {
                if (err.code === "ER_CON_COUNT_ERROR") {
                    console.log("Pool error");
                }
                else {
                    throw err;
                }
            }
            else {
                try {
                    connection.query(queryStatement, [values], function (err, result) {
                        connection.release();
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(result);
                        }
                    });
                }
                catch (error) {
                    console.log(queryStatement);
                    console.log("MYSQL SERVER ERROR\n" + error);
                }
            }
        });
    });
}
function getName(steam64) { //Uses the steam64 id and looksup the corresponding name from common tf2 competitive websites in order by: Etf2l,RGL,Ozfortress and logs.tf
    return new Promise(function (resolve, reject) {
        try {
            executeQuery("SELECT name FROM players WHERE steam64 = " + mysql.escape(steam64)).then(async function (result : any) {
                if (!result.length) {
                    console.log("Adding new player: " + steam64);
                    const promises = [];
                    promises.push(getEtf2lName(steam64));
                    promises.push(getOzFortressName(steam64));
                    promises.push(getLogstfName(steam64));
                    resolve( promises.reduce((p_, p) => {
                        p.catch(() => null); // avoid unhandled rejections.
                        return p_.catch(() => p);
                    }, Promise.reject()));

                }
                else {
                    resolve (result[0].name);
                }
            }).catch(err => { reject(err); });
        }
        catch (error) {
            reject(error);
        }
    });
}
function getEtf2lName(steam64) {
    return new Promise(function (resolve, reject) {
        requestPromiseJson(`https://api.etf2l.org/player/${steam64}.json`).then(body => {
            try {
                 resolve(body.player.name);
            }catch {
                reject();
            }
        }, err => { console.log(err); reject(err); });
    });
}

function getOzFortressName(steam64) {
    return new Promise(function (resolve, reject) {
        requestPromise(`https://ozfortress.com/users?q=${steam64}` ).then(body => {
            try {
                const parser = new DOMParser();
                const dom = parser.parseFromString(body);
                const name = dom.getElementsByClassName("row slim-gutter")[0].getElementsByTagName("a")[0].textContent;
                resolve(name);
            }
            catch{
                reject();
            }
        }, err => { console.log(err); reject(err); });
    });
}
function getLogstfName(steam64) {
    return new Promise(function (resolve, reject) {
        requestPromise(`https://logs.tf/profile/${steam64}` ).then(body => {
            try {
                const parser = new DOMParser();
                const dom = parser.parseFromString(body);
                const name = dom.getElementsByClassName("log-header")[0].getElementsByTagName("h3")[0].textContent.toString();
                const SteamId = require("steamid");
                const steam3 = new SteamId(steam64).getSteam3RenderedID();
                if (name === steam3.toString()) {
                    reject(new Error("Couldn't get name"));
                }
                else {
                    resolve(name);
                }
            }
            catch{
                reject(new Error("Couldn't get name"));
            }
        }, err => { console.log(err); reject(err); });
    });
}

function updateMapTable(steam64, limit = 1000) {
    return new Promise(async function (resolve, reject) { //Needs to be optimized: Only call if map undefined?
        const body : any = await requestPromiseJson(`https://logs.tf/api/v1/log?player=${steam64}&limit=${limit}`).catch(error => { console.log(error); reject(); });
        const values = [];
        try {
            for (const log in body.logs) {
                values.push([body.logs[log].id, body.logs[log].map]);
            }

            executeQuery("INSERT IGNORE INTO maps (logid,mapName) VALUES ?", values).then(value => {
                resolve(value);

            }, reason => {
                reject(reason);
            });
        }
        catch (error) {
            console.log(error);
            reject(error);
        }
    });
}

async function insertIntoDatabase(logid, databaseName = config.MySQLdatabase) { //Maybe look into more efficient way of doing this| batch downloading?
    return new Promise(function (resolve, reject) {
        try {
            request(`https://logs.tf/logs/log_${logid}.log.zip`, { encoding: null }, function (error, response, body) {
                if (error || response.statusCode !== 200) {
                    console.log(error);
                    reject(error);
                }
                else {
                    JSZip.loadAsync(body).then(function (zip) {
                        return zip.file(`log_${ logid }.log`).async("text");
                    }).then(async function (text) {
                        text = text.split('\n');
                        try {
                            LogParser.parseLines(text, logid, databaseName).mysql().then(function () {
                                resolve(true);
                            }).catch(error => { console.log("This probably broke things: " + error); });
                        }
                        catch (err) { //Need to save the logs that don't work to file
                            console.log(err);
                            reject(`Logfile: ${logid} couldn't be parsed correctly`); 
                            try {
                                const access = fs.createWriteStream('./error.log', { flags: 'a' });
                                access.write(`Logfile: ${logid} couldn't be parsed correctly\n`);
                                access.close();
                            }
                            catch{
                                console.log("Couldn't write to file.");
                            }
                        }
                    });
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
}