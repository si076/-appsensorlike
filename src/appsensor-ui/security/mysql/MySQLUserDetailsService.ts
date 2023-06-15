import * as msql from 'mysql2';
import { Logger } from '../../../logging/logging.js';

import { Authority, Group, User, UserDetails, UserDetailsService } from "../UserDetailsService.js";
import { ConnectionManager } from './connection_manager.js';

class UserDetailsImpl implements UserDetails {
    private authorities: Authority[];
    private username: string;
    private password: string;
    private enabled: boolean;
    private accountNonExpired: boolean;
    private accountNonLocked: boolean;
    private credentialsNonExpired: boolean;

    constructor(authorities: Authority[],
                username: string,
                password: string,
                enabled: boolean,
                accountNonExpired: boolean = true,
                accountNonLocked: boolean = true,
                credentialsNonExpired: boolean = true) {
        this.authorities = authorities;
        this.username = username;
        this.password = password;
        this.enabled = enabled;
        this.accountNonExpired = accountNonExpired;
        this.accountNonLocked = accountNonLocked;
        this.credentialsNonExpired = credentialsNonExpired;
    }

    getAuthorities(): Authority[] {
        return this.authorities;
    }

    getPassword(): string {
        return this.password;
    }

    getUsername(): string {
        return this.username;
    }

    isAccountNonExpired(): boolean {
        return this.accountNonExpired;
    }

    isAccountNonLocked(): boolean {
        return this.accountNonLocked;
    }

    isCredentialsNonExpired(): boolean {
        return this.credentialsNonExpired;
    }

    isEnabled(): boolean {
        return this.enabled
    }

}

class MySQLUserDetailsService implements UserDetailsService {

    async loadUserByUsername(username: string): Promise<UserDetails | null> {
        const connection = await ConnectionManager.getConnection();

        let sql = "select a.id, a.authority "
                        + "from ui_users u, "
                        +      "ui_authorities a, "
                        +      "ui_user_authorities ua "
                    + "where u.username = ua.username "
                        + "and ua.authority_id = a.id "
                        + `and u.username = '${username}'`;

        const authoritiesByUserName = 
            await MySQLUserDetailsService.executeSQLOnDB<Authority[]>(sql, (results: {id: number, 
                                                                         authority: string}[]) => {
                const authorities: Authority[] = [];

                results.forEach(el => {
                    const authorit = new Authority();
                    authorit.setId(el.id);
                    authorit.setName(el.authority);

                    authorities.push(authorit);
                });

                return authorities;
            },
            connection);

        
        sql = "select a.id, a.authority "
                + "from ui_users u, "
                    +  "ui_authorities a, "
                    + "`ui_groups` g, "
                    +  "ui_group_authorities ga, "
                    +  "ui_group_users gu "
                + "where u.username = gu.username "
                    + "and gu.group_id = g.id "
                    + "and g.id = ga.group_id "
                    + "and ga.authority_id = a.id "
                    + `and u.username = '${username}'`;
        
        const groupAuthoritiesByUserName = 
            await MySQLUserDetailsService.executeSQLOnDB<Authority[]>(sql, (results: {id: number, 
                                                                         authority: string}[]) => {
                const authorities: Authority[] = [];

                results.forEach(el => {
                    const authorit = new Authority();
                    authorit.setId(el.id);
                    authorit.setName(el.authority);

                    authorities.push(authorit);
                });

                return authorities;
            },
            connection);

        sql = `select username, password, enabled from ui_users where username = '${username}'`;   
        const userByUsername = 
            await MySQLUserDetailsService.executeSQLOnDB
                    <{username: string,password: string ,enabled: boolean} | null>(sql, (results: {username: string,
                                                                                                   password: string,
                                                                                                   enabled: boolean}[]) => {
                let res: {username: string, password: string , enabled: boolean} | null = null;

                if (results.length > 0) {
                    res = results[0];
                }

                return res;
            },
            connection);

        connection.release();

        let userDetails: UserDetails | null = null;
        if (userByUsername) {
            const userAuthorities: Authority[] = authoritiesByUserName.concat(groupAuthoritiesByUserName);

            userDetails = new UserDetailsImpl(userAuthorities, 
                                              userByUsername.username, 
                                              userByUsername.password, 
                                              userByUsername.enabled);
        }
        
        return userDetails;
    }

    public static async executeSQLOnDB<T>(sql:string, 
                                          funcProcessingResult: (results: any) => T, 
                                          connection: msql.PoolConnection): Promise<T> {
        return new Promise<T>((resolve, reject) => {

            Logger.getServerLogger().trace("MySQLUserDetailsService.executeSQLOnDB sql: ", sql);

            connection.query(sql, (err:msql.QueryError | null, 
                            res:any, 
                            fields: msql.FieldPacket[]) => {

                if (err) {
                    Logger.getServerLogger().error("Utils.executeSQLOnDB: ", err);
                    
                    reject(err);
                    return;
                }

                if (res instanceof Array) {
                    Logger.getServerLogger().trace("MySQLUserDetailsService.executeSQLOnDB records count: ", res.length);
                }

                resolve(funcProcessingResult(res));

            });

        })
        
    }

}

export {MySQLUserDetailsService};