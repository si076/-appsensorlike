CREATE TABLE `ui_users` (
  `username` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL,
  `enabled` tinyint(1) NOT NULL,
  PRIMARY KEY (`username`)
);

CREATE TABLE `ui_authorities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `authority` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) AUTO_INCREMENT=4;

CREATE TABLE `ui_groups` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `group_name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) AUTO_INCREMENT=4;

CREATE TABLE `ui_group_authorities` (
  `group_id` bigint unsigned NOT NULL,
  `authority_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`group_id`,`authority_id`),
  KEY `fk_group_authorities_authority` (`authority_id`),
  CONSTRAINT `fk_group_authorities_authority` FOREIGN KEY (`authority_id`) REFERENCES `ui_authorities` (`id`),
  CONSTRAINT `fk_group_authorities_group` FOREIGN KEY (`group_id`) REFERENCES `ui_groups` (`id`)
);

CREATE TABLE `ui_user_authorities` (
  `username` varchar(50) NOT NULL,
  `authority_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`authority_id`,`username`),
  KEY `fk_user_authorities_user` (`username`),
  CONSTRAINT `fk_user_authorities_authority` FOREIGN KEY (`authority_id`) REFERENCES `ui_authorities` (`id`),
  CONSTRAINT `fk_user_authorities_user` FOREIGN KEY (`username`) REFERENCES `ui_users` (`username`)
);

CREATE TABLE `ui_group_users` (
  `username` varchar(50) NOT NULL,
  `group_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`username`,`group_id`),
  KEY `fk_group_users_group` (`group_id`),
  CONSTRAINT `fk_group_users_group` FOREIGN KEY (`group_id`) REFERENCES `ui_groups` (`id`),
  CONSTRAINT `fk_group_users_user` FOREIGN KEY (`username`) REFERENCES `ui_users` (`username`)
);

CREATE TABLE `ui_user_client_applications` (
  `username` varchar(50) NOT NULL,
  `client_application_name` varchar(150) NOT NULL,
  PRIMARY KEY (`username`,`client_application_name`),
  CONSTRAINT `fk_user_client_applications_user` FOREIGN KEY (`username`) REFERENCES `ui_users` (`username`)
);

-- ********************  BASE AUTHORITIES ********************** 
INSERT INTO `ui_authorities` (authority) VALUES ('USER_ADMINISTRATION');
-- view / edit appsensor server config via UI
INSERT INTO `ui_authorities` (authority) VALUES ('VIEW_CONFIGURATION');
-- INSERT INTO `ui_authorities` (authority) VALUES ('EDIT_CONFIGURATION');
-- normal system usage (dashboards, detail, etc.)
INSERT INTO `ui_authorities` (authority) VALUES ('VIEW_DATA');

-- ********************  BASE GROUPS **********************
INSERT INTO `ui_groups` (group_name) VALUES ('ANALYST');
INSERT INTO `ui_groups` (group_name) VALUES ('USER_ADMINISTRATOR');
INSERT INTO `ui_groups` (group_name) VALUES ('SYSTEM_ADMINISTRATOR');

-- ********************  GROUP AUTHORITY MATCHING **********************
INSERT INTO `ui_group_authorities` (group_id, authority_id) VALUES (
	(select id from `ui_groups` where group_name = 'ANALYST'), 
	(select id from `ui_authorities` where authority = 'VIEW_DATA'));
INSERT INTO `ui_group_authorities` (group_id, authority_id) VALUES (
	(select id from `ui_groups` where group_name = 'ANALYST'), 
	(select id from `ui_authorities` where authority = 'VIEW_CONFIGURATION'));
-- INSERT INTO `ui_group_authorities` (group_id, authority_id) VALUES (
--	(select id from `ui_groups` where group_name = 'SYSTEM_ADMINISTRATOR'), 
--	(select id from `ui_authorities` where authority = 'EDIT_CONFIGURATION'));
INSERT INTO `ui_group_authorities` (group_id, authority_id) VALUES (
	(select id from `ui_groups` where group_name = 'USER_ADMINISTRATOR'), 
	(select id from `ui_authorities` where authority = 'USER_ADMINISTRATION'));
