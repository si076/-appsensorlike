create table attack (id int not null auto_increment, timestamp datetime(3), detection_point_id int, detection_system_id int, resource_id int, rule_id int, user_id int, metadata_uuid char(36), primary key (id));
create table metadata (metadata_uuid char(36) not null, key_value_pair_id int not null, primary key (metadata_uuid, key_value_pair_id));
create table detection_point (id int not null auto_increment, category varchar(255), guid char(36), label varchar(255), threshold_id int, primary key (id));
create table detection_system (id int not null auto_increment, detection_system_id varchar(255), ip_address int, primary key (id));
create table appsensorevent (id int not null auto_increment, timestamp datetime(3), detection_point_id int, detection_system_id int, resource_id int, user_id int, metadata_uuid char(36), primary key (id));
create table geo_location (id int not null auto_increment, latitude double precision not null, longitude double precision not null, primary key (id));
create table `interval` (id int not null auto_increment, duration int, unit varchar(255), primary key (id));
create table ipaddress (id int not null auto_increment, address varchar(255), geo_location int, primary key (id));
create table key_value_pair (id int not null auto_increment, `key` varchar(255), value varchar(255), primary key (id));
create table `resource` (id int not null auto_increment, location varchar(255), method varchar(255), primary key (id));
create table response (id int not null auto_increment, action varchar(255), active bit, timestamp datetime(3), detection_system_id int, interval_id int, user_id int, metadata_uuid char(36), primary key (id));
create table rule (id int not null auto_increment, guid char(36), name varchar(255), window_id int, primary key (id));
create table threshold (id int not null auto_increment, t_count int, interval_id int, primary key (id));
create table `user` (id int not null auto_increment, ip_address int, username varchar(255), primary key (id));
alter table attack add constraint FK_s98tpuvqslroj348sg3sio3jf foreign key (detection_point_id) references detection_point (id);
alter table attack add constraint FK_dokpx7286ln9icedoii8usqcr foreign key (detection_system_id) references detection_system (id);
alter table attack add constraint FK_2pfeq8ihvpophdnwv45rw290 foreign key (resource_id) references resource (id);
alter table attack add constraint FK_mvfjh3pri1vnviuwbdk73sye foreign key (rule_id) references rule (id);
alter table attack add constraint FK_trt3wyyi1vbk04im3sewj7xb7 foreign key (user_id) references user (id);
alter table attack add constraint fk_attack_metadata_uuid FOREIGN KEY (metadata_uuid) REFERENCES metadata (metadata_uuid);
alter table detection_point add constraint FK_log2mnu5axh69d1hn0agi78y foreign key (threshold_id) references threshold (id);
alter table appsensorevent add constraint FK_cyiuhwt60r0nq5ej6j9wm27x0 foreign key (detection_point_id) references detection_point (id);
alter table appsensorevent add constraint FK_iqyyd9crqnfm2q4q740ygm1e1 foreign key (detection_system_id) references detection_system (id);
alter table appsensorevent add constraint FK_ei0063idkhgfh6pqv2hsfont1 foreign key (resource_id) references resource (id);
alter table appsensorevent add constraint FK_p84ruvsg7mfwb2x5p7iq3q103 foreign key (user_id) references user (id);
alter table appsensorevent add constraint fk_appsensorevent_metadata_uuid FOREIGN KEY (metadata_uuid) REFERENCES metadata (metadata_uuid);
alter table response add constraint FK_87uubvo2fgwwpbmfcfkp82a62 foreign key (detection_system_id) references detection_system (id);
alter table response add constraint FK_cqbci2wy6y9upuqsel4asb3fl foreign key (interval_id) references `interval` (id);
alter table response add constraint FK_1j5vg1wv52y5trquwxsa1bmno foreign key (user_id) references user (id);
alter table response add constraint fk_response_metadata_uuid FOREIGN KEY (metadata_uuid) REFERENCES metadata (metadata_uuid)
alter table rule add constraint FK_e0jelcpuf1edn8lubjrp8agx2 foreign key (window_id) references `interval` (id);
alter table threshold add constraint FK_cmrw7h9idnjhcqd6mfv4w4u5d foreign key (interval_id) references `interval` (id);
alter table metadata add constraint fk_metadata_key_value_pair_id FOREIGN KEY (key_value_pair_id) REFERENCES key_value_pair (id);