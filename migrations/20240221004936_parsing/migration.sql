-- CreateTable
CREATE TABLE `parsed_logs` (
    `id` INTEGER NOT NULL,
    `json` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
