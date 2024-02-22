-- CreateTable
CREATE TABLE `duplicatelogids` (
    `logid` INTEGER NOT NULL,
    `duplicateof` INTEGER NOT NULL,

    INDEX `FK_duplicatelogs_logs`(`duplicateof`),
    PRIMARY KEY (`logid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `eventid` BIGINT NOT NULL AUTO_INCREMENT,
    `logid` INTEGER NOT NULL,
    `attacker` BIGINT NOT NULL,
    `victim` BIGINT NULL,
    `killstreak` INTEGER NULL,
    `headshot` BOOLEAN NULL,
    `airshot` INTEGER NULL,
    `medicDrop` BOOLEAN NULL,
    `second` INTEGER NOT NULL,
    `capture` INTEGER NULL,
    `kill` BOOLEAN NULL,
    `backstab` BOOLEAN NULL,
    `medicDeath` BOOLEAN NULL,
    `advantageLost` INTEGER NULL,
    `chargeUsed` BOOLEAN NULL,
    `weapon` VARCHAR(30) NULL,

    INDEX `FK_events_logs`(`logid`),
    INDEX `attacker_index`(`attacker`),
    INDEX `victim_index`(`victim`),
    PRIMARY KEY (`eventid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs` (
    `logid` INTEGER NOT NULL,
    `date` INTEGER NOT NULL,
    `redPoints` INTEGER NULL,
    `bluePoints` INTEGER NULL,
    `timeTaken` INTEGER NULL,
    `playeramount` INTEGER NULL,
    `official` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `duplicateLogs`(`date`, `redPoints`, `bluePoints`, `timeTaken`, `playeramount`),
    PRIMARY KEY (`logid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maps` (
    `logid` INTEGER NOT NULL,
    `mapName` VARCHAR(30) NOT NULL,

    PRIMARY KEY (`logid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `players` (
    `steam64` BIGINT NOT NULL,
    `etf2lName` VARCHAR(40) NULL,
    `ugcName` VARCHAR(40) NULL,
    `ozFortressName` VARCHAR(40) NULL,
    `logstfName` VARCHAR(40) NULL,
    `updatedAt` DATE NULL,
    `name` VARCHAR(40) NULL,

    PRIMARY KEY (`steam64`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plays_classes` (
    `plays_inId` BIGINT NOT NULL,
    `class` VARCHAR(15) NOT NULL,
    `kills` INTEGER NULL,
    `assists` INTEGER NULL,
    `deaths` INTEGER NULL,
    `damage` INTEGER NULL,
    `damageTaken` INTEGER NULL,
    `accuracy` DECIMAL(4, 2) NULL,
    `healsReceived` INTEGER NULL,
    `healsDistributed` INTEGER NULL,

    UNIQUE INDEX `oneClass`(`plays_inId`, `class`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plays_in` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `steam64` BIGINT NULL,
    `logid` INTEGER NOT NULL,
    `blue` BOOLEAN NOT NULL,
    `kills` INTEGER NOT NULL,
    `assists` INTEGER NOT NULL,
    `deaths` INTEGER NOT NULL,
    `damage` INTEGER NOT NULL,
    `damageTaken` INTEGER NOT NULL,
    `healsReceived` INTEGER NOT NULL,
    `healsDistributed` INTEGER NOT NULL,
    `ubers` INTEGER NOT NULL,
    `drops` INTEGER NOT NULL,
    `kritz` INTEGER NOT NULL,
    `class` VARCHAR(15) NULL,

    INDEX `FK_plays_in_logs`(`logid`),
    UNIQUE INDEX `steam64`(`steam64`, `logid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `duplicatelogids` ADD CONSTRAINT `FK_duplicatelogs_logs` FOREIGN KEY (`duplicateof`) REFERENCES `logs`(`logid`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `FK_events_logs` FOREIGN KEY (`logid`) REFERENCES `logs`(`logid`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `plays_classes` ADD CONSTRAINT `FK_plays_in_plays_classes` FOREIGN KEY (`plays_inId`) REFERENCES `plays_in`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `plays_in` ADD CONSTRAINT `FK_plays_in_logs` FOREIGN KEY (`logid`) REFERENCES `logs`(`logid`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `plays_in` ADD CONSTRAINT `FK_plays_in_players` FOREIGN KEY (`steam64`) REFERENCES `players`(`steam64`) ON DELETE NO ACTION ON UPDATE NO ACTION;
