-- MySQL dump 10.13  Distrib 5.7.19, for Win32 (AMD64)
--
-- Host: localhost    Database: demoticks
-- ------------------------------------------------------
-- Server version	5.7.19-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `duplicatelogids`
--

DROP TABLE IF EXISTS `duplicatelogids`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `duplicatelogids` (
  `logid` int(11) NOT NULL,
  `duplicateof` int(11) NOT NULL,
  PRIMARY KEY (`logid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `events` (
  `eventid` bigint(20) NOT NULL AUTO_INCREMENT,
  `logid` bigint(20) NOT NULL,
  `attacker` varchar(20) DEFAULT NULL,
  `victim` varchar(20) DEFAULT NULL,
  `killstreak` int(11) DEFAULT NULL,
  `headshot` tinyint(1) DEFAULT NULL,
  `airshot` tinyint(1) DEFAULT NULL,
  `medicDrop` tinyint(1) DEFAULT NULL,
  `tick` int(11) NOT NULL,
  `capture` int(11) DEFAULT NULL,
  `kill` tinyint(1) DEFAULT NULL,
  `backstab` tinyint(1) DEFAULT NULL,
  `medicDeath` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`eventid`) USING BTREE,
  KEY `FK_events_logs` (`logid`),
  CONSTRAINT `FK_events_logs` FOREIGN KEY (`logid`) REFERENCES `logs` (`logid`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1764045 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logs` (
  `logid` bigint(20) NOT NULL,
  `date` int(11) NOT NULL,
  `redPoints` int(11) DEFAULT NULL,
  `bluePoints` int(11) DEFAULT NULL,
  `timeTaken` int(11) DEFAULT NULL,
  `playeramount` int(11) DEFAULT NULL,
  PRIMARY KEY (`logid`) USING BTREE,
  UNIQUE KEY `dublicateLogs` (`date`,`redPoints`,`bluePoints`,`timeTaken`,`playeramount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `maps`
--

DROP TABLE IF EXISTS `maps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `maps` (
  `logid` int(11) NOT NULL,
  `mapName` varchar(30) NOT NULL,
  PRIMARY KEY (`logid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `players`
--

DROP TABLE IF EXISTS `players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `players` (
  `steam64` varchar(20) CHARACTER SET utf8 NOT NULL,
  `name` varchar(40) CHARACTER SET utf8 NOT NULL,
  `steamId3` varchar(20) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`steam64`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plays_in`
--

DROP TABLE IF EXISTS `plays_in`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `plays_in` (
  `steam64` varchar(20) NOT NULL,
  `logid` bigint(20) NOT NULL,
  `blue` tinyint(1) NOT NULL,
  `kills` int(11) DEFAULT NULL,
  `assists` int(11) DEFAULT NULL,
  `deaths` int(11) DEFAULT NULL,
  `damage` int(11) DEFAULT NULL,
  `damageTaken` int(11) DEFAULT NULL,
  `healsReceived` int(11) DEFAULT NULL,
  `healsDistributed` int(11) DEFAULT NULL,
  `ubers` int(11) DEFAULT NULL,
  `drops` int(11) DEFAULT NULL,
  `kritz` int(11) DEFAULT NULL,
  `class` varchar(15) DEFAULT NULL,
  KEY `FK_plays_in_logs` (`logid`),
  CONSTRAINT `FK_plays_in_logs` FOREIGN KEY (`logid`) REFERENCES `logs` (`logid`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-12-20 20:19:03
