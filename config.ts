interface IConfig {
    port: number
    MySQLHost: string
    MySQLPort: number
    MySQLUser: string 
    MySQLPassword: string
    MySQLdatabase: string
    MySQLdatabaseStats : string
    MySQLConnectionLimit: number
    MySQLLogging: boolean
    requestLimit: number
}

export const config: IConfig = {
    port: parseInt(process.env.port|| "4351"), 
    MySQLHost: process.env.sqlHost || "localhost", //demoticks_mysql
    MySQLPort: parseInt(process.env.sqlPort ||"3306"),
    MySQLUser: process.env.sqlUser ||"demoticksAdmin",
    MySQLPassword: process.env.sqlPassword ||"password",
    MySQLdatabase: process.env.sqldatabase || "demoticks",
    MySQLdatabaseStats: process.env.sqldatabase || "demoticksStats",
    MySQLConnectionLimit: 50,
    MySQLLogging: parseInt(process.env.mysqllogging|| "0") == 1 ? true : false,
    requestLimit: 400,
};

