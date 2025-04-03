
-- 表结构: alembic_version
CREATE TABLE alembic_version (
	version_num VARCHAR(32) NOT NULL, 
	CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- 表数据: alembic_version
INSERT INTO alembic_version VALUES ('add_config_management');


-- 表结构: api_configs
CREATE TABLE api_configs (
	id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	url VARCHAR NOT NULL, 
	method VARCHAR NOT NULL, 
	headers VARCHAR, 
	body VARCHAR, 
	created_at DATETIME, 
	created_by VARCHAR NOT NULL, 
	updated_at DATETIME, 
	updated_by VARCHAR NOT NULL, 
	PRIMARY KEY (id)
);

-- 表数据: api_configs


-- 表结构: config_files
CREATE TABLE config_files (
	id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	device_type VARCHAR NOT NULL, 
	content VARCHAR, 
	created_at DATETIME, 
	created_by VARCHAR NOT NULL, 
	updated_at DATETIME, 
	updated_by VARCHAR NOT NULL, 
	PRIMARY KEY (id)
);

-- 表数据: config_files


-- 表结构: config_versions
CREATE TABLE config_versions (
	id VARCHAR NOT NULL, 
	config_id VARCHAR NOT NULL, 
	version INTEGER NOT NULL, 
	content VARCHAR NOT NULL, 
	created_at DATETIME, 
	created_by VARCHAR NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(config_id) REFERENCES config_files (id), 
	CONSTRAINT uix_config_version UNIQUE (config_id, version)
);

-- 表数据: config_versions


-- 表结构: category_api_configs
CREATE TABLE category_api_configs (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	type VARCHAR(50) NOT NULL, 
	endpoint VARCHAR(255) NOT NULL, 
	auth_type VARCHAR(50) NOT NULL, 
	timeout INTEGER, 
	headers JSON, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);

-- 表数据: category_api_configs


-- 表结构: users
CREATE TABLE users (
	id INTEGER NOT NULL, 
	username VARCHAR, 
	email VARCHAR, 
	hashed_password VARCHAR, 
	is_active BOOLEAN, 
	is_ldap_user BOOLEAN, 
	ldap_dn VARCHAR, 
	department VARCHAR, 
	role VARCHAR, 
	totp_secret VARCHAR, 
	totp_enabled BOOLEAN, 
	backup_codes VARCHAR, 
	failed_login_attempts INTEGER, 
	locked_until VARCHAR, 
	last_login VARCHAR, 
	password_changed_at VARCHAR, 
	PRIMARY KEY (id)
);

-- 表数据: users
INSERT INTO users VALUES (1, 'admin', 'admin@example.com', '$2b$12$z9.IDT0yJoXoetpVGhvFC.Wsf6Bgd7Yt.HWQJl.eCU0/VZoBmojdC', 1, 0, NULL, 'IT', 'Admin', 'QV6IFA7YGNPQIFJNZT7H3EE5NH5CWA5J', 0, '["SCCYNL8C", "U9SGIG6G", "3NXPGSXX", "QUFFNZSB", "GO5K4U5L", "10KBQFAR", "3B1WRIW7", "6N2H9EJF", "VO0K8X06", "A8ZGTQVS"]', 0, NULL, '2025-04-02T10:56:51.728478', '2025-03-24T11:42:24.625271');
INSERT INTO users VALUES (2, 'tset007', 'tset007@1.com', '$2b$12$oOwiNSGc.FwvKTRjf1ZDBepeWhmBTtT8OkDG8XjLvn39rgojEzBdO', 1, 0, NULL, NULL, 'Admin', '3H235UI2E332AOBHL65TWMKHFOITTTEP', 1, '["OX488Q2H", "KTXZ6YYU", "Q58UUW16", "31ZEB9QJ", "AX4KF2Y9", "QH17R3YZ", "GN8MPLLB", "D6UQXYZH", "AD3DNHDZ", "0K37GPZA"]', 0, NULL, '2025-03-24T11:44:16.410890', '2025-03-24T11:43:31.710361');


-- 表结构: audit_logs
CREATE TABLE audit_logs (
	id INTEGER NOT NULL, 
	timestamp VARCHAR, 
	user_id INTEGER, 
	username VARCHAR, 
	event_type VARCHAR, 
	ip_address VARCHAR, 
	user_agent VARCHAR, 
	details VARCHAR, 
	success BOOLEAN, 
	PRIMARY KEY (id)
);

-- 表数据: audit_logs
INSERT INTO audit_logs VALUES (1, '2025-03-24T11:35:55.771050', NULL, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', '{"reason": "Invalid credentials"}', 0);
INSERT INTO audit_logs VALUES (2, '2025-03-24T11:38:58.751274', NULL, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', '{"reason": "Invalid credentials"}', 0);
INSERT INTO audit_logs VALUES (3, '2025-03-24T11:39:14.151277', NULL, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', '{"reason": "Invalid credentials"}', 0);
INSERT INTO audit_logs VALUES (4, '2025-03-24T11:39:24.790853', NULL, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', '{"reason": "Invalid credentials"}', 0);
INSERT INTO audit_logs VALUES (5, '2025-03-24T11:42:41.072074', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (6, '2025-03-24T11:42:44.190817', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (7, '2025-03-24T11:42:44.198808', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (8, '2025-03-24T11:43:31.738669', 1, 'admin', 'create_user', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', '{"username": "tset007"}', 1);
INSERT INTO audit_logs VALUES (9, '2025-03-24T11:43:31.791522', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (10, '2025-03-24T11:43:34.580252', 1, 'admin', 'logout', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (11, '2025-03-24T11:43:41.280551', 2, 'tset007', 'login_2fa_required', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (12, '2025-03-24T11:43:41.336972', 2, 'tset007', 'totp_setup', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (13, '2025-03-24T11:43:58.646927', 2, 'tset007', 'totp_verify', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (14, '2025-03-24T11:44:05.378541', 2, 'tset007', 'logout', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (15, '2025-03-24T11:44:11.180566', 2, 'tset007', 'login_2fa_required', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (16, '2025-03-24T11:44:16.413178', 2, 'tset007', 'totp_verify', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (17, '2025-03-24T11:44:18.492703', 2, 'tset007', 'logout', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (18, '2025-03-24T11:44:21.315487', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (19, '2025-03-24T11:49:09.625644', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (20, '2025-03-24T11:49:09.637152', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (21, '2025-03-24T13:05:52.832525', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (22, '2025-03-24T13:05:57.954179', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (23, '2025-03-24T13:05:57.962353', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (24, '2025-03-24T14:51:13.904549', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (25, '2025-03-24T14:53:31.404381', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (26, '2025-03-24T15:05:30.578239', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (27, '2025-03-24T15:29:40.953134', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (28, '2025-03-24T15:29:40.969051', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (29, '2025-03-24T15:29:55.723661', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (30, '2025-03-24T15:29:55.732205', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (31, '2025-03-25T04:09:03.447544', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (32, '2025-03-25T06:36:57.252214', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (33, '2025-03-25T06:56:13.952382', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (34, '2025-03-25T07:13:58.110094', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (35, '2025-03-25T07:46:07.852251', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (36, '2025-03-25T07:49:22.185579', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (37, '2025-03-25T08:05:12.338503', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (38, '2025-03-25T08:12:07.807774', 1, 'admin', 'logout', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (39, '2025-03-25T08:15:01.739884', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (40, '2025-03-25T08:15:16.158702', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (41, '2025-03-25T08:17:18.633415', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (42, '2025-03-25T08:17:29.081696', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (43, '2025-03-25T08:21:33.204456', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (44, '2025-03-25T08:22:48.693086', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (45, '2025-03-25T08:23:06.093319', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (46, '2025-03-25T08:23:16.511686', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (47, '2025-03-25T08:25:01.900771', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (48, '2025-03-25T08:25:15.700666', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (49, '2025-03-25T08:25:15.708113', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (50, '2025-03-25T08:25:43.626879', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (51, '2025-03-25T08:28:53.861445', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (52, '2025-03-25T08:30:00.406656', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (53, '2025-03-25T08:34:00.689186', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (54, '2025-03-25T08:35:56.121055', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (55, '2025-03-25T08:36:19.659640', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (56, '2025-03-25T08:37:39.731060', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (57, '2025-03-25T08:44:03.641697', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (58, '2025-03-25T08:44:33.997736', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (59, '2025-03-25T08:50:50.837442', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (60, '2025-03-25T08:53:36.140570', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (61, '2025-03-25T08:53:40.638466', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (62, '2025-03-25T08:59:53.866263', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (63, '2025-03-25T09:00:11.957239', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (64, '2025-03-25T09:09:03.063139', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (65, '2025-03-25T14:21:41.947993', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (66, '2025-03-25T14:43:36.668889', 1, 'admin', 'logout', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (67, '2025-03-25T14:43:57.625814', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (68, '2025-03-25T14:44:24.665846', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (69, '2025-03-26T02:21:42.239060', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (70, '2025-03-26T03:17:55.330509', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (71, '2025-03-26T03:51:33.354305', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (72, '2025-03-26T08:41:09.231086', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (73, '2025-03-27T02:03:30.320420', NULL, 'admin007', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', '{"reason": "Invalid credentials"}', 0);
INSERT INTO audit_logs VALUES (74, '2025-03-27T02:10:30.661251', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (75, '2025-03-27T07:15:47.018910', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (76, '2025-03-27T08:24:29.568570', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (77, '2025-03-27T11:58:20.167717', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (78, '2025-03-27T12:32:46.443327', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (79, '2025-03-28T11:46:58.410213', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (80, '2025-03-28T12:25:09.012779', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (81, '2025-03-28T12:53:27.352665', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (82, '2025-03-28T12:55:47.629293', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (83, '2025-03-28T13:26:38.985282', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (84, '2025-03-28T13:58:49.162189', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (85, '2025-03-28T14:17:48.755669', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (86, '2025-03-28T14:46:19.569449', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (87, '2025-03-28T15:16:41.957858', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (88, '2025-03-28T15:49:49.132993', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (89, '2025-03-29T07:32:20.702862', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (90, '2025-03-29T08:40:25.911341', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (91, '2025-03-29T13:56:27.307626', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (92, '2025-03-29T14:30:13.863128', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (93, '2025-03-29T14:59:40.736957', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (94, '2025-03-29T14:59:40.753477', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (95, '2025-03-29T15:02:36.891624', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (96, '2025-03-29T15:13:24.497792', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (97, '2025-03-29T15:13:24.507792', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (98, '2025-03-29T15:33:26.291508', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (99, '2025-03-29T16:04:10.793702', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (100, '2025-03-29T16:11:25.530739', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (101, '2025-03-29T16:11:25.546629', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (102, '2025-03-29T16:35:35.127203', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (103, '2025-03-29T17:06:17.736627', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (104, '2025-03-30T04:25:49.649178', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (105, '2025-03-30T04:25:52.260058', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (106, '2025-03-30T04:25:52.260058', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (107, '2025-03-30T05:01:07.679091', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (108, '2025-03-30T06:23:49.652931', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (109, '2025-03-30T06:55:52.538903', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (110, '2025-03-30T13:33:02.353837', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (111, '2025-03-30T14:03:53.868694', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (112, '2025-03-30T14:34:16.992926', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (113, '2025-03-30T14:50:53.464782', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (114, '2025-03-30T14:50:53.464782', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (115, '2025-03-31T03:46:09.609332', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (116, '2025-03-31T07:05:32.437797', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (117, '2025-03-31T09:24:40.411840', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (118, '2025-03-31T09:46:10.181753', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (119, '2025-03-31T09:51:26.300418', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (120, '2025-03-31T09:51:28.139874', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (121, '2025-03-31T09:51:28.164203', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (122, '2025-03-31T09:54:46.587454', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (123, '2025-03-31T09:56:00.465432', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36', NULL, 1);
INSERT INTO audit_logs VALUES (124, '2025-03-31T09:59:32.001307', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36', NULL, 1);
INSERT INTO audit_logs VALUES (125, '2025-03-31T10:23:55.597970', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (126, '2025-03-31T10:28:44.409141', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (127, '2025-03-31T13:55:44.932534', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (128, '2025-03-31T14:35:26.852694', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (129, '2025-03-31T15:10:36.641888', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (130, '2025-03-31T15:26:48.887456', 1, 'admin', 'logout', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (131, '2025-03-31T15:26:54.183535', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (132, '2025-04-01T03:58:37.022113', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (133, '2025-04-01T07:00:59.114757', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (134, '2025-04-01T08:02:32.151879', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (135, '2025-04-01T08:12:10.358694', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (136, '2025-04-01T08:12:10.368785', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (137, '2025-04-01T08:12:38.838983', 1, 'admin', 'totp_setup', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (138, '2025-04-01T10:01:26.912895', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (139, '2025-04-01T10:39:05.202825', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (140, '2025-04-01T11:09:25.625264', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (141, '2025-04-01T11:42:17.043893', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (142, '2025-04-01T13:40:02.873252', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (143, '2025-04-01T14:13:18.362767', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (144, '2025-04-01T14:13:24.022348', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (145, '2025-04-01T14:13:24.031893', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (146, '2025-04-02T10:56:51.758347', 1, 'admin', 'login', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (147, '2025-04-02T10:58:35.319179', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (148, '2025-04-02T10:58:35.325489', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (149, '2025-04-02T11:02:34.943712', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);
INSERT INTO audit_logs VALUES (150, '2025-04-02T11:02:34.952838', 1, 'admin', 'list_users', NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0', NULL, 1);


-- 表结构: refresh_tokens
CREATE TABLE refresh_tokens (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	token VARCHAR, 
	expires_at VARCHAR, 
	is_revoked BOOLEAN, 
	PRIMARY KEY (id)
);

-- 表数据: refresh_tokens
INSERT INTO refresh_tokens VALUES (1, 1, 'rRlHHm-Ir5xTrBkDlgwO89ZNKqos5nDlsxIwj2RxfRs', '2025-03-31T11:42:41.059060', 0);
INSERT INTO refresh_tokens VALUES (2, 2, 'k8_tQHf9T1KQdbTwl3NSrJpWPeLdol_8tfLWDFFHOZA', '2025-03-31T11:43:58.634732', 0);
INSERT INTO refresh_tokens VALUES (3, 2, 'cyiCiKbRayxSpoXVWGEdSzsaRYogbxXnV2DGXIvz7Rk', '2025-03-31T11:44:16.404734', 0);
INSERT INTO refresh_tokens VALUES (4, 1, 'Wd7XVsBZ_ArGZocHvw8NNEImAOaBGwC02ayhSzHkuX0', '2025-03-31T11:44:21.307030', 0);
INSERT INTO refresh_tokens VALUES (5, 1, '-EA1JMVX9x7ILOWESYm1oCqKv1aVmK5jtd94oDwsjFs', '2025-03-31T13:05:52.820627', 0);
INSERT INTO refresh_tokens VALUES (6, 1, 'sv8zBpshBATYwyqT_ow1kzU_7jQpLBsgEzkZZuUDH-M', '2025-03-31T14:51:13.893066', 0);
INSERT INTO refresh_tokens VALUES (7, 1, 'iuIZ13tpsD8erubeYWupt3z9UQ1ecS9lovwUhQ0EcAU', '2025-03-31T14:53:31.393208', 0);
INSERT INTO refresh_tokens VALUES (8, 1, 'h-So-DU7mqSFseBoIukDJK1QpPCmyhqO1VtkU0M6Jmw', '2025-03-31T15:05:30.565603', 0);
INSERT INTO refresh_tokens VALUES (9, 1, 'yfk73c4Fz5a_l5Pxj9LmGPh3afYW9n9Pk3fJ9Si0ndo', '2025-04-01T04:09:03.436443', 0);
INSERT INTO refresh_tokens VALUES (10, 1, 'Bot6q_hqeIYVAgi3xduU71vLFeAAaogEAz2zgVdDm7w', '2025-04-01T06:36:57.237786', 0);
INSERT INTO refresh_tokens VALUES (11, 1, 'ybAeWgy0t_-3R4x1p077qb6zLy-L8MWX0FKB0rbcPiA', '2025-04-01T06:56:13.936934', 0);
INSERT INTO refresh_tokens VALUES (12, 1, 'sRSKbu0wXYlqBFzFUKuUOOsdDcgSJNV0dDmHa4MJlLU', '2025-04-01T07:13:58.096576', 0);
INSERT INTO refresh_tokens VALUES (13, 1, 'V1MHt3cBvNkq91-XwYa7bk695xtxQAit8AOoJwJ7Mv8', '2025-04-01T07:46:07.839251', 0);
INSERT INTO refresh_tokens VALUES (14, 1, 'MjdZJ39MLRB_3B-nBLD7T4-pcjIkt2PcECZrvtGU4pk', '2025-04-01T07:49:22.168068', 0);
INSERT INTO refresh_tokens VALUES (15, 1, 'JN_OkaYdV0BryZpjL4vV77gw0TFDFAigG_-_nk_1KjI', '2025-04-01T08:05:12.327842', 0);
INSERT INTO refresh_tokens VALUES (16, 1, 'q-W5zUUV5BTLjB15Xs86g9K2ADpz9HX9IaYN9bNI5SM', '2025-04-01T08:15:01.732586', 0);
INSERT INTO refresh_tokens VALUES (17, 1, '_HKLu7EmlqHuqrxy41lKV4outWvnHNsFlGwHfUaQ0uQ', '2025-04-01T08:15:16.150129', 0);
INSERT INTO refresh_tokens VALUES (18, 1, 'r1lJaeMquK81Uvgc9XEMxrodLa85Zm0LzF8MNmYlSnM', '2025-04-01T08:17:18.617146', 0);
INSERT INTO refresh_tokens VALUES (19, 1, 'gxDaAjHfhAgnDbKwk0dVw2ZsKSQvCH7wm6NNGbuWn44', '2025-04-01T08:17:29.069091', 0);
INSERT INTO refresh_tokens VALUES (20, 1, 'vX287DT55ZsSEB4je6rMnpYSGCUixwhC5okeslb1ob0', '2025-04-01T08:21:33.189625', 0);
INSERT INTO refresh_tokens VALUES (21, 1, 'JciV9b1sUbNEbHT93d6W__2kgV0ipZIF9_lXXAsbcy4', '2025-04-01T08:22:48.677284', 0);
INSERT INTO refresh_tokens VALUES (22, 1, 'HMexdS5IffXHOxirDaC0rZ__1RE-pMhz67EePGyQeoY', '2025-04-01T08:23:06.084815', 0);
INSERT INTO refresh_tokens VALUES (23, 1, 'mIFppE2WHurRj2kKQ3HM-w4a9jyrHCKfSoVSKzEkXTI', '2025-04-01T08:23:16.499093', 0);
INSERT INTO refresh_tokens VALUES (24, 1, '6mbWqpi8X9tT_gyhI6FGyEWuN_NXDUv7W_uez_Dbztg', '2025-04-01T08:25:01.888325', 0);
INSERT INTO refresh_tokens VALUES (25, 1, '10Wa1N5DHJnDGFMqFxxYi_fgtW5ZiZamxBV5fSqGq4A', '2025-04-01T08:25:43.617168', 0);
INSERT INTO refresh_tokens VALUES (26, 1, '9Jj7d_lehlPcZlymIj3B1B1NzcstqF_Fzh5wdDwytEU', '2025-04-01T08:28:53.848583', 0);
INSERT INTO refresh_tokens VALUES (27, 1, '2tfbsW7QuoZFX1tR8_yI2IwumBWZhe4t3SkHIyhShEU', '2025-04-01T08:30:00.398508', 0);
INSERT INTO refresh_tokens VALUES (28, 1, 'YVw8sFJaGpT6rx4VCIZdI56OyKOERRsMyY2JBr3hxxA', '2025-04-01T08:34:00.675040', 0);
INSERT INTO refresh_tokens VALUES (29, 1, 'SCLYwOo-K3wkH9YxyPdv-xq9hzOA1HEHWxChyHkybTk', '2025-04-01T08:35:56.105672', 0);
INSERT INTO refresh_tokens VALUES (30, 1, 'DTNhWtsznc80C2L0lvu8mmEfB8GMztBscyXuhSIMhaA', '2025-04-01T08:36:19.648717', 0);
INSERT INTO refresh_tokens VALUES (31, 1, '-pigJy69Amjx-8PfTrLn9ZIZ7O6Q2obfhjPyMB9luok', '2025-04-01T08:37:39.718516', 0);
INSERT INTO refresh_tokens VALUES (32, 1, 'S9bB4x1bKAeSibyXE01f8RqCkC2TV4Y7OiU5VA7OqBs', '2025-04-01T08:44:03.630315', 0);
INSERT INTO refresh_tokens VALUES (33, 1, 'PG9HHoL3bvHHqVGoV932ez6vxcXDA9lsxv4KI-GFBP4', '2025-04-01T08:44:33.989224', 0);
INSERT INTO refresh_tokens VALUES (34, 1, 'CLEFIr1_G2TQ4AQv4rYV2-VneSYSfgZPmMUDVFVNrjg', '2025-04-01T08:50:50.824708', 0);
INSERT INTO refresh_tokens VALUES (35, 1, 'S-i-VwrafMZcFpfQooC1IWBmCw5wfJh9G8XMUVsluAg', '2025-04-01T08:53:36.128057', 0);
INSERT INTO refresh_tokens VALUES (36, 1, 'e-f1_0Th7XacZ38VpPZV_YNsuvirFMju4WmjDBuZmbg', '2025-04-01T08:53:40.629985', 0);
INSERT INTO refresh_tokens VALUES (37, 1, 'rHNmIY_TKcHZ0qT75CIzyeb6cl-4Mchqu8zBwyfObTQ', '2025-04-01T08:59:53.856036', 0);
INSERT INTO refresh_tokens VALUES (38, 1, 'R6OgiohDUUl4yLtm2qvJGDCqrDeCrvD18dLU6QuNwz0', '2025-04-01T09:00:11.948197', 0);
INSERT INTO refresh_tokens VALUES (39, 1, 'SfKKzXZCqvKZDAtdr_Ng0wr5VR1-9GdWA8zMet3ySPM', '2025-04-01T09:09:03.047743', 0);
INSERT INTO refresh_tokens VALUES (40, 1, 'dsAr-FXVh8KgDj0HcZhNWH1k88tGh9WuPi7hk6zzMQA', '2025-04-01T14:21:41.936958', 0);
INSERT INTO refresh_tokens VALUES (41, 1, '7y3k7fTrJZHyOKqgEEI2X7PEgUs0YkKd9kItgYQtqM8', '2025-04-01T14:43:57.616241', 0);
INSERT INTO refresh_tokens VALUES (42, 1, 'iApZ7HBrj8KVcP5FHyC1Ju34wTr_S2zpnYe4-nXa0mc', '2025-04-01T14:44:24.658191', 0);
INSERT INTO refresh_tokens VALUES (43, 1, '2UXcEMNdOpUBu45r3JXdODr3RtjhNdy1J0boDVN0yJQ', '2025-04-02T02:21:42.224950', 0);
INSERT INTO refresh_tokens VALUES (44, 1, 'ipmxeks2dHkjDGQgaWcfVXUsfec-5LisNDSE0zfLCwc', '2025-04-02T03:17:55.311363', 0);
INSERT INTO refresh_tokens VALUES (45, 1, 'OiIEupJGr_-1zfEvRy78iAfVjRCBsByXqmbI-qSLjQk', '2025-04-02T03:51:33.354305', 0);
INSERT INTO refresh_tokens VALUES (46, 1, 'q801K7LKIBFO5LBXbk4zQeizLU6rHyv4GrVNIqNolQo', '2025-04-02T08:41:09.216768', 0);
INSERT INTO refresh_tokens VALUES (47, 1, '0d-XcSafdYlG_lLeL5VdPoxMrTC9cdvsyJtYbkQX8Eo', '2025-04-03T02:10:30.649698', 0);
INSERT INTO refresh_tokens VALUES (48, 1, '09GfMykSbY7QqgULJXXlSdz8UGKXneuRQqWxraoPI7Q', '2025-04-03T07:15:47.003048', 0);
INSERT INTO refresh_tokens VALUES (49, 1, 'ca7zbuVO-78oCF0HrGkDxtS6s8lPmp2961q7HRYTRDY', '2025-04-03T08:24:29.568570', 0);
INSERT INTO refresh_tokens VALUES (50, 1, 'cnOLrLF3eNAlNMQ4NihDea7ejnpyWdXmpw8TN-_t4xA', '2025-04-03T11:58:20.153577', 0);
INSERT INTO refresh_tokens VALUES (51, 1, 'xgcfsGha4qQTGR9vacxw3XLOTXtdI1TE72XOL05pmwQ', '2025-04-03T12:32:46.443327', 0);
INSERT INTO refresh_tokens VALUES (52, 1, 'k4EodM9HuZaz7hsb8uh7E4ThIMaR0Iacf9m9IyXEO6Q', '2025-04-04T11:46:58.395387', 0);
INSERT INTO refresh_tokens VALUES (53, 1, 'IXBqBIyjU688E1ld1-XZzBXH_oxilP9SLLqHhcq5GR4', '2025-04-04T12:25:09.005212', 0);
INSERT INTO refresh_tokens VALUES (54, 1, 'jeaaWikUqs1z8pXJi5eb-ZwsPex5wFaTl7qkOTXP4Q4', '2025-04-04T12:53:27.339523', 0);
INSERT INTO refresh_tokens VALUES (55, 1, '2JJtwJrL9TDIG6ZsNjxo2bT0iOeaafwvH4Oon-2a7Vg', '2025-04-04T12:55:47.620533', 0);
INSERT INTO refresh_tokens VALUES (56, 1, 'UnVBdmHoKGkvfghojdP3ksb7Cvk0FcdCxRyF4REZdLk', '2025-04-04T13:26:38.975835', 0);
INSERT INTO refresh_tokens VALUES (57, 1, '27HMMUwZedipqfy5at6cXfSGzAQTVmxFRUOMY7EsmxM', '2025-04-04T13:58:49.148972', 0);
INSERT INTO refresh_tokens VALUES (58, 1, 'H5M-VmEvx9p76kVX4bE2VQZtkE2obUsY_rQgFJ0CxaU', '2025-04-04T14:17:48.741905', 0);
INSERT INTO refresh_tokens VALUES (59, 1, 'T1vDDkPr8aROUj2d4tx217bIiMJTPeQq1cXdXxqIUKs', '2025-04-04T14:46:19.556275', 0);
INSERT INTO refresh_tokens VALUES (60, 1, 'eOrKV6Q3oh28Pb14aGs22UIjWMfE3oeSZ39MXgFkUnc', '2025-04-04T15:16:41.944231', 0);
INSERT INTO refresh_tokens VALUES (61, 1, '8aEj9B17BE35w9Uy_9zcdaGBcgajGQHPLrQqOuPl5VA', '2025-04-04T15:49:49.120801', 0);
INSERT INTO refresh_tokens VALUES (62, 1, '9ShLsjsYDl_s0NCQLY-NSoDGJn2sXi6a_9qgrJ1bQ1E', '2025-04-05T07:32:20.689231', 0);
INSERT INTO refresh_tokens VALUES (63, 1, 'NOW1Z6r_CPXVaYshdmhtLqgYFT4dy9Q7rFCymdQ0k94', '2025-04-05T08:40:25.902328', 0);
INSERT INTO refresh_tokens VALUES (64, 1, 'XYaiy0k-vm59w-FVtdces5G1nVrgPMTh4pBnAL38MrM', '2025-04-05T13:56:27.296405', 0);
INSERT INTO refresh_tokens VALUES (65, 1, '22jk-8RGWPvkZm_n2K3XK9ErsEVkJyKz_mPTolwDKNo', '2025-04-05T14:30:13.847446', 0);
INSERT INTO refresh_tokens VALUES (66, 1, 'uU5o5xDdnpUeS_EphSl-v_K2cHiPQui040SKf7tL5BA', '2025-04-05T15:02:36.884847', 0);
INSERT INTO refresh_tokens VALUES (67, 1, 'AIIjYAOokD3-pUAc9Gs6ZZlTZI6lhVaBD7mN9ARci-0', '2025-04-05T15:33:26.275860', 0);
INSERT INTO refresh_tokens VALUES (68, 1, 'PmlvBbb91ogldoiRO9kR1EPoVAO2kakOm4H_YhsiilU', '2025-04-05T16:04:10.777873', 0);
INSERT INTO refresh_tokens VALUES (69, 1, 'dTg3VMkHMDENXbr49uo1Ai1MrA5Z8JSRzORN43tp8rk', '2025-04-05T16:35:35.121375', 0);
INSERT INTO refresh_tokens VALUES (70, 1, 'F-TSEusLl1x-1bcB8-e7ha76RBKntcbtkjWzscgooXY', '2025-04-05T17:06:17.736627', 0);
INSERT INTO refresh_tokens VALUES (71, 1, '93Ge9rGdInfCAnq7gvA1FfkkLyyYASY0yULQM7lzPI4', '2025-04-06T04:25:49.643488', 0);
INSERT INTO refresh_tokens VALUES (72, 1, 'ZrsQYzwYq3_rJjgpoWJfJ9sMt_Jma2tGfgVzjQnsYDQ', '2025-04-06T05:01:07.668215', 0);
INSERT INTO refresh_tokens VALUES (73, 1, 'MEKjRU8-dYGaFOq81r3nC_NUCEdu96ZGl1cgE3zCNWA', '2025-04-06T06:23:49.633851', 0);
INSERT INTO refresh_tokens VALUES (74, 1, 'F1A5b9jqA13mcj1hN_qM33ZTQFn10aP5rTyia3H6qL0', '2025-04-06T06:55:52.522957', 0);
INSERT INTO refresh_tokens VALUES (75, 1, '-EcJlKWMqXspNFRREKAu2iaiOmpj9l09utVBJsONq0M', '2025-04-06T13:33:02.338170', 0);
INSERT INTO refresh_tokens VALUES (76, 1, 't3MCeW2D137THk5TlFm8kV-sfhlj4lq0UzE2KegTQ54', '2025-04-06T14:03:53.868694', 0);
INSERT INTO refresh_tokens VALUES (77, 1, '-hmdw3DCiJhCoCBZ2ae4EbRib_aV3yQ4wbXi6vCeM-c', '2025-04-06T14:34:16.985374', 0);
INSERT INTO refresh_tokens VALUES (78, 1, '6IKq0ARJovueJ2xoz6uQBhPMfbtFdKfhVuB6c2PGRoE', '2025-04-07T03:46:09.593348', 0);
INSERT INTO refresh_tokens VALUES (79, 1, 'mJxvU9jSLSbj_gv9cH3HL-kmAZ2XOaSFb_9JdDEDKqA', '2025-04-07T07:05:32.421907', 0);
INSERT INTO refresh_tokens VALUES (80, 1, 'OHgiP3tRbC1ylC4WGRYym4ZGKotz5OY0HkCva8ynja0', '2025-04-07T09:24:40.402402', 0);
INSERT INTO refresh_tokens VALUES (81, 1, 'MTR1BFdyRFPuw8-r01jGN0g1braEgPyTh84ixtux0g4', '2025-04-07T09:46:10.173165', 0);
INSERT INTO refresh_tokens VALUES (82, 1, 'oJjQiNy4o3b5eftTTcWoSIsWh0-fE6yuSb7HtrcTMEo', '2025-04-07T09:51:26.281703', 0);
INSERT INTO refresh_tokens VALUES (83, 1, 'UOtltPyS_eb9w8OMTc6LOR45wqhUG-pm2fEJ2QEeW00', '2025-04-07T09:54:46.572015', 0);
INSERT INTO refresh_tokens VALUES (84, 1, '2gNMVFUi8oMoJa9bUAdOCL_uybUrtHKA7c-87a8cCl8', '2025-04-07T09:56:00.465432', 0);
INSERT INTO refresh_tokens VALUES (85, 1, 'py2tHHn26s2KZ5Icnb8La08vyqmMmCMfnPMoYDr0UrA', '2025-04-07T09:59:31.985257', 0);
INSERT INTO refresh_tokens VALUES (86, 1, 'ZK3a-zdlBESNA6S2oChHxI_xTbBSbYFV6aPAUSZ_mps', '2025-04-07T10:23:55.588615', 0);
INSERT INTO refresh_tokens VALUES (87, 1, 'qajNm_SRsIKY7iidc2Ycgu1iTbasIegOv9JpIr_xkiA', '2025-04-07T10:28:44.409141', 0);
INSERT INTO refresh_tokens VALUES (88, 1, '-98dAmgx7oiUPYqKMMEt2RrFmUMFodX99YVio9mgSOA', '2025-04-07T13:55:44.917245', 0);
INSERT INTO refresh_tokens VALUES (89, 1, 'LSou14z9Z0quJEHgLByZAq37vrdZyi1lS2Vw0nnCD50', '2025-04-07T14:35:26.836447', 0);
INSERT INTO refresh_tokens VALUES (90, 1, 'DUM3u3Gj4Q30ROQ64dCcdVNFn1oZe0OzdemWuqmcAWE', '2025-04-07T15:10:36.625841', 0);
INSERT INTO refresh_tokens VALUES (91, 1, 'kROg9X_f17EZjh4Ywnbsu6tsofMA6eEdwvvuU0dpRkA', '2025-04-07T15:26:54.167652', 0);
INSERT INTO refresh_tokens VALUES (92, 1, 'wSB1r0qM_fJVTfFvl84uvTdBW6ss4tG9Ui7OO6sm87U', '2025-04-08T03:58:37.009575', 0);
INSERT INTO refresh_tokens VALUES (93, 1, '1Qeo7mXp84W8DwJmXjF0EediE19mMHcpFVwywsQrgHc', '2025-04-08T07:00:59.114757', 0);
INSERT INTO refresh_tokens VALUES (94, 1, 'QC0QYFlpqtog3IviNG0_JZIochVGXM6UjkSSWIbnQFM', '2025-04-08T08:02:32.143124', 0);
INSERT INTO refresh_tokens VALUES (95, 1, 'OIuZBBJbqid8D8yQ0vnudrJX08yiHTPBCN1usjHmwow', '2025-04-08T10:01:26.901767', 0);
INSERT INTO refresh_tokens VALUES (96, 1, 'Ey-lyFALLKBO-dyeTm8PBbgc-QkB4E6Fm0T_NJDMCfo', '2025-04-08T10:39:05.196476', 0);
INSERT INTO refresh_tokens VALUES (97, 1, 'TfVDBcIn1tnrXOz_i98x6XmbYIyK16UlD0kuWCnJV4Q', '2025-04-08T11:09:25.609501', 0);
INSERT INTO refresh_tokens VALUES (98, 1, 'o61nJnKgLHYzdeAauKJB8D7xj0Q0lKcPAmLGFXI2zE8', '2025-04-08T11:42:17.031201', 0);
INSERT INTO refresh_tokens VALUES (99, 1, '2dno9vOu-4Wh35rHwip6lodGqotpE-zDA3cHbed264M', '2025-04-08T13:40:02.860324', 0);
INSERT INTO refresh_tokens VALUES (100, 1, 'Ro0h9Sz4W2hVo_Di4ZBJxJzBSRFy6Cg3HtSJFI4wY5A', '2025-04-08T14:13:18.346865', 0);
INSERT INTO refresh_tokens VALUES (101, 1, 'gG95D97M3rDlIi7jUMdeUMO_Mr--qODFi990mU28STA', '2025-04-09T10:56:51.744767', 0);


-- 表结构: ldap_config
CREATE TABLE ldap_config (
	id INTEGER NOT NULL, 
	server_url VARCHAR, 
	bind_dn VARCHAR, 
	bind_password VARCHAR, 
	search_base VARCHAR, 
	user_search_filter VARCHAR, 
	group_search_filter VARCHAR, 
	require_2fa BOOLEAN, 
	admin_group_dn VARCHAR, 
	operator_group_dn VARCHAR, 
	auditor_group_dn VARCHAR, 
	PRIMARY KEY (id)
);

-- 表数据: ldap_config


-- 表结构: used_totp
CREATE TABLE used_totp (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	totp_code VARCHAR, 
	used_at VARCHAR, 
	expires_at VARCHAR, 
	PRIMARY KEY (id)
);

-- 表数据: used_totp
INSERT INTO used_totp VALUES (1, 2, '951297', '2025-03-24T11:43:58.628759', '2025-03-31T11:43:58.628759');
INSERT INTO used_totp VALUES (2, 2, '987300', '2025-03-24T11:44:16.402994', '2025-03-31T11:44:16.402994');


-- 表结构: security_settings
CREATE TABLE security_settings (
	id INTEGER NOT NULL, 
	password_expiry_days INTEGER, 
	max_failed_attempts INTEGER, 
	lockout_duration_minutes INTEGER, 
	session_timeout_minutes INTEGER, 
	require_2fa_for_admins BOOLEAN, 
	password_complexity_enabled BOOLEAN, 
	password_min_length INTEGER, 
	password_require_uppercase BOOLEAN, 
	password_require_lowercase BOOLEAN, 
	password_require_numbers BOOLEAN, 
	password_require_special BOOLEAN, 
	PRIMARY KEY (id)
);

-- 表数据: security_settings
INSERT INTO security_settings VALUES (1, 90, 5, 15, 60, 1, 1, 8, 1, 1, 1, 0);


-- 表结构: category_device_groups
CREATE TABLE category_device_groups (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description TEXT, 
	created_at DATETIME, 
	PRIMARY KEY (id)
);

-- 表数据: category_device_groups
INSERT INTO category_device_groups VALUES (1, '111', NULL, '2025-03-24 11:46:03.788388');


-- 表结构: credential_mgt_credentials
CREATE TABLE credential_mgt_credentials (
	id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description TEXT, 
	credential_type VARCHAR(12) NOT NULL, 
	created_at DATETIME, 
	updated_at DATETIME, 
	username VARCHAR(100), 
	password VARCHAR(255), 
	enable_password VARCHAR(255), 
	api_key VARCHAR(255), 
	api_secret VARCHAR(255), 
	private_key TEXT, 
	passphrase VARCHAR(255), 
	PRIMARY KEY (id)
);

-- 表数据: credential_mgt_credentials
INSERT INTO credential_mgt_credentials VALUES (1, 'tset007', NULL, 'SSH_PASSWORD', '2025-03-24 11:46:39.650325', '2025-03-24 11:46:39.650325', 'tset007', 'tset007', NULL, NULL, NULL, NULL, NULL);


-- 表结构: category_device_group_members
CREATE TABLE category_device_group_members (
	id INTEGER NOT NULL, 
	group_id INTEGER, 
	device_id INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(group_id) REFERENCES category_device_groups (id) ON DELETE CASCADE
);

-- 表数据: category_device_group_members
INSERT INTO category_device_group_members VALUES (1, 1, 1);
INSERT INTO category_device_group_members VALUES (2, 1, 3);


-- 表结构: sqlite_sequence
CREATE TABLE sqlite_sequence(name,seq);

-- 表数据: sqlite_sequence
INSERT INTO sqlite_sequence VALUES ('rpa_config_files', 16);


-- 表结构: rpa_config_files
CREATE TABLE rpa_config_files (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name VARCHAR(100) NOT NULL,
                        template_type VARCHAR(20) NOT NULL,
                        content TEXT NOT NULL,
                        description VARCHAR(500),
                        device_type VARCHAR(50) NOT NULL DEFAULT 'default',
                        status VARCHAR(20) NOT NULL DEFAULT 'draft',
                        created_at DATETIME NOT NULL,
                        updated_at DATETIME NOT NULL
                    );

-- 表数据: rpa_config_files
INSERT INTO rpa_config_files VALUES (1, '华为tacacs', 'jinja2', '{#######################
  TACACS服务器模板配置示例
{
  "configuration": {
    "auth_scheme": "tacacs-auth",
    "tacacs_servers": [
      {
        "ip": "192.168.1.10",
        "port": "49",
        "priority": "1"
      },
      {
        "ip": "192.168.1.11",
        "port": "49",
        "priority": "2"
      }
    ],
    "shared_key": "amber123",
    "timeout": "5",
    "retry": "3",
    "source_interface": "Vlanif10",
    "authz_scheme": "tacacs-authz",
    "privilege_level": "15",
    "enable_ssh": true
  }
}
#########################}
tacacs-server template {{ configuration.auth_scheme }}
{% for server in configuration.tacacs_servers %}
 server {{ server.ip }} port {{ server.port }} priority {{ server.priority }}
{% endfor %}
 shared-key cipher {{ configuration.shared_key | replace('' '', ''_'') }}
 timeout {{ configuration.timeout }}
 retransmit {{ configuration.retry }}
{% if configuration.source_interface %}
 source-interface {{ configuration.source_interface }}
{% endif %}

{#################
 AAA认证配置
#################}
aaa
 authentication-scheme {{ configuration.auth_scheme }}
  authentication-mode tacacs local

 authorization-scheme {{ configuration.authz_scheme }}
  authorization-mode tacacs local

 domain default
  authentication-scheme {{ configuration.auth_scheme }}
  authorization-scheme {{ configuration.authz_scheme }}
  admin-user privilege level {{ configuration.privilege_level }}

{########################
 用户界面配置
########################}
user-interface vty 0 4
 authentication-mode aaa
 protocol inbound ssh

{#########################
 可选SSH服务配置
##########################}
{% if configuration.enable_ssh %}
stelnet server enable
sftp server enable
ssh user admin authentication-type password
ssh user admin service-type all
rsa local-key-pair create
{% endif %}

{# 接口状态检测（示例） #}
{% for server in configuration.tacacs_servers %}
nqa test-instance admin {{ server.ip }}-check
 test-type icmp
 destination-address ipv4 {{ server.ip }}
 frequency 10
start now
{% endfor %}', NULL, 'huawei_vrp', 'published', '2025-03-28 14:01:00.301087', '2025-03-31 13:59:47.057721');
INSERT INTO rpa_config_files VALUES (6, '华为tacacs_1743346234387', 'job', '
tacacs-server template tacacs-auth

 server 192.168.1.10 port 49 priority 1

 server 192.168.1.11 port 49 priority 2

 shared-key cipher amber123
 timeout 5
 retransmit 3

 source-interface Vlanif10



aaa
 authentication-scheme tacacs-auth
  authentication-mode tacacs local

 authorization-scheme tacacs-authz
  authorization-mode tacacs local

 domain default
  authentication-scheme tacacs-auth
  authorization-scheme tacacs-authz
  admin-user privilege level 15


user-interface vty 0 4
 authentication-mode aaa
 protocol inbound ssh



stelnet server enable
sftp server enable
ssh user admin authentication-type password
ssh user admin service-type all
rsa local-key-pair create




nqa test-instance admin 192.168.1.10-check
 test-type icmp
 destination-address ipv4 192.168.1.10
 frequency 10
start now

nqa test-instance admin 192.168.1.11-check
 test-type icmp
 destination-address ipv4 192.168.1.11
 frequency 10
start now
', NULL, 'huawei_vrp', 'published', '2025-03-30 14:50:34.397432', '2025-03-31 14:15:33.065287');

