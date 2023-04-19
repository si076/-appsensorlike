import { FieldInfo, MysqlError, Pool, PoolConnection } from "mysql";
import { ConnectionManager } from "./connection_manager.js";

class Utils {

    public static async executeSQLOnDB<T>(sql:string, funcProcessingResult: (results: any) => T, connection?: PoolConnection): Promise<T> {
        return new Promise<T>((resolve, reject) => {

            let conn: Pool | PoolConnection | undefined = connection;

            if (!conn) {
                conn = ConnectionManager.getPool();
            }

            conn.query(sql, (err:MysqlError | null, 
                            res:any, 
                            fields: FieldInfo[]) => {

                if (err) {
                    console.log(err);
                    
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

            conn.query(sql, (err:MysqlError | null, 
                            res:any, 
                            fields: FieldInfo[]) => {

                if (err) {
                    console.log(err);
                    
                    reject(err);
                    return;
                }

                funcProcessingResult(res, resolve);

            });

        })
        
    }

    public static async executeInTransaction(obj: any, 
                                        execInTransCallback: (obj: any, 
                                            connection: PoolConnection) => Promise<any>,
                                        retryCounter: number = 0): Promise<any> {
        return new Promise((resolve, reject) => {

            // console.log('In executeInTransaction Promise');

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
        
                        reject(error);
                        return;
                    }

                    execInTransCallback(obj, connection)
                    .then((res) => {

                        connection.commit((err) => {
                            if (err) {
            
                                connection.rollback(() => {
                                    connection.release();

                                    reject(error);
                                    return;
                                });
                            }

                            connection.release();

                            resolve(res);
                        });
        
                    })
                    .catch((error) => {
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
