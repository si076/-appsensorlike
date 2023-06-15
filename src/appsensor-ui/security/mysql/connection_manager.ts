import * as msql from 'mysql2';

import { JSONConfigManager, JSONConfigReadValidate } from '../../../utils/Utils.js';
import { Logger } from '../../../logging/logging.js';

class MySQLSesionStorageConfig {
    poolOptions: msql.PoolOptions = {};
}


class ConnectionManager {

    private static pool: msql.Pool;

    private static defaultConfigFile       = './appsensor-ui/security/mysql/appsensor-ui-session-storage-mysql-config.json';
    private static defaultConfigSchemeFile = './appsensor-ui/security/mysql/appsensor-ui-session-storage-mysql-config_schema.json';
    private static configFile              = 'appsensor-ui-session-storage-mysql-config.json';
    private static configSchemeFile        = './appsensor-ui/security/mysql/appsensor-ui-session-storage-mysql-config_schema.json';

    private static configManager = 
                        new JSONConfigManager(new JSONConfigReadValidate(ConnectionManager.defaultConfigFile, 
                                                                         ConnectionManager.defaultConfigSchemeFile, 
                                                                         MySQLSesionStorageConfig.prototype), 
                                                                         ConnectionManager.configFile, 
                                                                         ConnectionManager.configSchemeFile,
                                                                         ConnectionManager.defaultConfigFile,
                                                                         ConnectionManager.defaultConfigSchemeFile,
                                                                         true);

    private static createPool(poolConfig: msql.PoolOptions) {
        Logger.getServerLogger().trace("ConnectionManager.createPool:");

        if (ConnectionManager.pool) {
            ConnectionManager.pool.end();
        }

        ConnectionManager.pool = msql.createPool(poolConfig);
    }

    static {

        ConnectionManager.createPool((ConnectionManager.configManager.getConfiguration() as MySQLSesionStorageConfig).poolOptions);

        ConnectionManager.configManager.listenForConfigurationChange((newConfig: any) => {
            const poolOptions: msql.PoolOptions = (newConfig as MySQLSesionStorageConfig).poolOptions;
            ConnectionManager.createPool(poolOptions);
        });
    
    }

    public static getPool(): msql.Pool {
        return ConnectionManager.pool;
    }

    public static getConnection(//connetionErrorHandler: ((error: MysqlError) => void) = ConnectionManager.defaultErrorHandler
                               ): Promise<msql.PoolConnection> {
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

}

export {ConnectionManager, MySQLSesionStorageConfig};
