-- MySQL dump 10.13  Distrib 8.0.25, for Win64 (x86_64)
--
-- Host: localhost    Database: demoticks
-- ------------------------------------------------------
-- Server version	8.0.25

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `duplicatelogids` (
  `logid` int NOT NULL,
  `duplicateof` int NOT NULL,
  PRIMARY KEY (`logid`),
  KEY `FK_duplicatelogs_logs` (`duplicateof`),
  CONSTRAINT `FK_duplicatelogs_logs` FOREIGN KEY (`duplicateof`) REFERENCES `logs` (`logid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `eventid` bigint NOT NULL AUTO_INCREMENT,
  `logid` int NOT NULL,
  `attacker` bigint NOT NULL,
  `victim` bigint DEFAULT NULL,
  `killstreak` int DEFAULT NULL,
  `headshot` tinyint(1) DEFAULT NULL,
  `airshot` tinyint(1) DEFAULT NULL,
  `medicDrop` tinyint(1) DEFAULT NULL,
  `second` int NOT NULL,
  `capture` int DEFAULT NULL,
  `kill` tinyint(1) DEFAULT NULL,
  `backstab` tinyint(1) DEFAULT NULL,
  `medicDeath` tinyint(1) DEFAULT NULL,
  `advantageLost` int DEFAULT NULL,
  `chargeUsed` tinyint(1) DEFAULT NULL,
  `weapon` varchar(30) CHARACTER SET utf8 DEFAULT NULL,
  PRIMARY KEY (`eventid`),
  KEY `FK_events_logs` (`logid`),
  KEY `attacker_index` (`attacker`),
  KEY `victim_index` (`victim`),
  CONSTRAINT `FK_events_logs` FOREIGN KEY (`logid`) REFERENCES `logs` (`logid`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs` (
  `logid` int NOT NULL,
  `date` int NOT NULL,
  `redPoints` int DEFAULT NULL,
  `bluePoints` int DEFAULT NULL,
  `timeTaken` int DEFAULT NULL,
  `playeramount` int DEFAULT NULL,
  `official` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`logid`),
  UNIQUE KEY `duplicateLogs` (`date`,`redPoints`,`bluePoints`,`timeTaken`,`playeramount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `maps`
--

DROP TABLE IF EXISTS `maps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maps` (
  `logid` int NOT NULL,
  `mapName` varchar(30) CHARACTER SET utf8 NOT NULL,
  PRIMARY KEY (`logid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `players`
--

DROP TABLE IF EXISTS `players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `players` (
  `steam64` bigint NOT NULL,
  `etf2lName` varchar(40) DEFAULT NULL,
  `ugcName` varchar(40) DEFAULT NULL,
  `ozFortressName` varchar(40) DEFAULT NULL,
  `logstfName` varchar(40) DEFAULT NULL,
  `updatedAt` date DEFAULT NULL,
  `name` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`steam64`),
  KEY `partial_name` (`name`(10))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plays_classes`
--

DROP TABLE IF EXISTS `plays_classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plays_classes` (
  `plays_inId` bigint NOT NULL,
  `class` varchar(15) NOT NULL,
  `kills` int DEFAULT NULL,
  `assists` int DEFAULT NULL,
  `deaths` int DEFAULT NULL,
  `damage` int DEFAULT NULL,
  `damageTaken` int DEFAULT NULL,
  `accuracy` decimal(4,2) DEFAULT NULL,
  `healsReceived` int DEFAULT NULL,
  `healsDistributed` int DEFAULT NULL,
  UNIQUE KEY `oneClass` (`plays_inId`,`class`),
  CONSTRAINT `FK_plays_in_plays_classes` FOREIGN KEY (`plays_inId`) REFERENCES `plays_in` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plays_in`
--

DROP TABLE IF EXISTS `plays_in`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plays_in` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `steam64` bigint DEFAULT NULL,
  `logid` int NOT NULL,
  `blue` tinyint(1) NOT NULL,
  `kills` int NOT NULL,
  `assists` int NOT NULL,
  `deaths` int NOT NULL,
  `damage` int NOT NULL,
  `damageTaken` int NOT NULL,
  `healsReceived` int NOT NULL,
  `healsDistributed` int NOT NULL,
  `ubers` int NOT NULL,
  `drops` int NOT NULL,
  `kritz` int NOT NULL,
  `class` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `steam64` (`steam64`,`logid`),
  KEY `FK_plays_in_logs` (`logid`),
  CONSTRAINT `FK_plays_in_logs` FOREIGN KEY (`logid`) REFERENCES `logs` (`logid`) ON DELETE CASCADE,
  CONSTRAINT `FK_plays_in_players` FOREIGN KEY (`steam64`) REFERENCES `players` (`steam64`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-10-21 20:45:08
