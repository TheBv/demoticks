const config = {};


config.port = process.env.port || 4351;
config.MySQLHost = process.env.sqlHost || "localhost"; //demoticks_mysql
config.MySQLPort = parseInt(process.env.sqlPort) ||3306;
config.MySQLUser = process.env.sqlUser ||"demoticksAdmin";
config.MySQLPassword = process.env.sqlPassword ||"password";
config.MySQLdatabase = process.env.sqldatabase || "demoticks";
config.MySQLdatabaseStats = process.env.sqldatabase || "demoticksStats";
config.MySQLConnectionLimit = 50;
config.requestLimit = 400;

module.exports = config;