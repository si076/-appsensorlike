import { FieldInfo, MysqlError, Pool, PoolConnection } from "mysql";

import { Logger } from "@appsensorlike/appsensorlike/logging/logging.js";
import { ConnectionManager } from "./connection_manager.js";

class Utils {

    public static async executeSQLOnDB<T>(sql:string, funcProcessingResult: (results: any) => T, connection?: PoolConnection): Promise<T> {
        return new Promise<T>((resolve, reject) => {

            let conn: Pool | PoolConnection | undefined = connection;

            if (!conn) {
                conn = ConnectionManager.getPool();
            }

            Logger.getServerLogger().trace("Utils.executeSQLOnDB sql: ", sql);

            conn.query(sql, (err:MysqlError | null, 
                            res:any, 
                            fields: FieldInfo[]) => {

                if (err) {
                    Logger.getServerLogger().error("Utils.executeSQLOnDB: ", err);
                    
                    reject(err);
                    return;
                }

                resolve(funcProcessingResult(res));

            });

        })
        
    }

    public static async executeSQLOnDBProcResAsync<T>(sql:string, funcProcessingResult: (results: any, resolve: (value: T | PromiseLike<T>) => void) => T, connection?: PoolConnection): Promise<T> {
        return new Promise<T>((resolve, reject) => {

            let conn: Pool | PoolConnection | undefined = connection;

            if (!conn) {
                conn = ConnectionManager.getPool();
            }

            Logger.getServerLogger().trace("Utils.executeSQLOnDBProcResAsync sql: ", sql);

            conn.query(sql, (err:MysqlError | null, 
                            res:any, 
                            fields: FieldInfo[]) => {

                if (err) {
                    Logger.getServerLogger().error("Utils.executeSQLOnDBProcResAsync: ", err);
                    
                    reject(err);
                    return;
                }

                funcProcessingResult(res, resolve);

            });

        })
        
    }

    public static async executeInTransaction(obj: any, 
                                             //connetionErrorHandler: (error: MysqlError) => void,
                                             execInTransCallback: (obj: any, 
                                                                   //connetionErrorHandler: ((error: MysqlError) => void),
                                                                   connection: PoolConnection) => Promise<any>,
                                             retryCounter: number = 0): Promise<any> {
        return new Promise((resolve, reject) => {

            Logger.getServerLogger().trace('Utils.executeInTransaction: In executeInTransaction Promise');

            ConnectionManager.getPool().getConnection((error: MysqlError, connection: PoolConnection) => {

                if (error) {
                    // try {
                    //     if (retry(obj, 
                    //               error, retryCounter + 1, 
                    //               resolve, reject,
                    //               executeInTransaction, 
                    //               [obj, execInTransCallback, retryCounter + 1])) {
                    //         return;
                    //     }
                    // } catch (error) {
                    //     reject(error);
                    //     return;
                    // }

                    Logger.getServerLogger().error("Utils.executeInTransaction: ", error);

                    reject(error);
                    return;
                }

                connection.beginTransaction((err) => {
                    if (err) { 
                        connection.release();

                        // try {
                        //     if (retry(obj,
                        //               error, retryCounter + 1, 
                        //               resolve, reject,
                        //               executeInTransaction, 
                        //               [obj, execInTransCallback, retryCounter + 1])) {
                        //         return;
                        //     }
                        // } catch (error) {
                        //     reject(error);
                        //     return;
                        // }

                        Logger.getServerLogger().error("Utils.executeInTransaction: ", err);
        
                        reject(err);
                        return;
                    }

                    execInTransCallback(obj, connection)
                    .then((res) => {

                        connection.commit((err) => {
                            if (err) {

                                Logger.getServerLogger().error("Utils.executeInTransaction: ", err);
            
                                connection.rollback(() => {
                                    connection.release();

                                    reject(err);
                                    return;
                                });
                            }

                            connection.release();

                            resolve(res);
                        });
        
                    })
                    .catch((error) => {
                        Logger.getServerLogger().error("Utils.executeInTransaction: ", error);

                        connection.rollback(() => {
                            connection.release();

                            reject(error);
                            return;
                        });
                    });

                });
                    
            });

        });
    } 

}

export {Utils};
