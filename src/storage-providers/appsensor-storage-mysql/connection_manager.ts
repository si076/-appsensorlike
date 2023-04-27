import { PoolConfig, PoolConnection, MysqlError, Pool, createPool } from 'mysql';
// import { ConfigurationManager, IConfiguration, TYPE_EVENT_CONFIG_RELOADED } from '../config/Configuration.mjs';
import { strict as assert } from 'assert';

class ConnectionManager {

    private static pool: Pool | null = null;

    private static poolConfig: PoolConfig;

    static {
    //     ConnectionManager.poolConfig = ConfigurationManager.getConfiguration().db;
    //     ConfigurationManager.listenForConfigurationReload(TYPE_EVENT_CONFIG_RELOADED.EVENT_DB_CONFIG_CHANGED, 
    //         (newConfig: IConfiguration) => {
    //             console.log('>>> ConnectionManager on config change');
    //             ConnectionManager.getPool(newConfig.db);
    //         });
        ConnectionManager.poolConfig =  {
            "user": "test",
            "password": "test2020",
            "database": "appsensor",
            "dateStrings": ["DATE","DATETIME"],
            "connectTimeout": 20000,
            "acquireTimeout": 20000,
            "waitForConnections": false,
            "connectionLimit": 1000,
            "queueLimit": 0
        };

    }

    static getPool(config: PoolConfig | null = null): Pool {
        let poolConfig: PoolConfig = ConnectionManager.poolConfig;
        let considerRecreate: boolean = false;

        if (config) {
            try {
                assert.deepStrictEqual(config, ConnectionManager.poolConfig);
            } catch (error) {
                // console.log(error);

                ConnectionManager.poolConfig = config;

                poolConfig = config;

                considerRecreate = true;
            }
        }

        if (!ConnectionManager.pool || considerRecreate) {

            if (ConnectionManager.pool) {
                ConnectionManager.pool.end();
            }

            console.log('considerRecreate: ' + considerRecreate);
            console.log(poolConfig);

            // const stack = new Error().stack
            // console.log( stack );

            ConnectionManager.pool = createPool(poolConfig);
        } 

        return ConnectionManager.pool;
    }

    public static getConnection(//connetionErrorHandler: ((error: MysqlError) => void) = ConnectionManager.defaultErrorHandler
                               ): Promise<PoolConnection> {
        return new Promise((resolve, reject) => {

            ConnectionManager.getPool().getConnection((err, connection) => {
                if (err) {
                    
                    reject(err);
                    return;
                }

                resolve(connection)
            });
        });
    }

    public static defaultErrorHandler(error: MysqlError) {
        console.error(error);
    }

}

export {ConnectionManager};
