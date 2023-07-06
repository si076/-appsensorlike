import { PoolConfig, PoolConnection, Pool, createPool } from 'mysql';
import { Logger } from '@appsensorlike/appsensorlike/logging/logging.js';
import { JSONConfigManager, JSONConfigReadValidate } from '@appsensorlike/appsensorlike/utils/Utils.js';

class MySQLStorageConfig {
    poolConfig: PoolConfig = {};
}

class ConnectionManager {

    private static pool: Pool;

    private static defaultConfigFile       = 'appsensor-storage-mysql-config.json';
    private static defaultConfigSchemeFile = 'appsensor-storage-mysql-config_schema.json';
    private static configFile              = 'appsensor-storage-mysql-config.json';
    private static configSchemeFile        = './storage-providers/appsensor-storage-mysql/appsensor-storage-mysql-config_schema.json';

    private static configManager = 
                        new JSONConfigManager(new JSONConfigReadValidate(import.meta.url,
                                                                         ConnectionManager.defaultConfigFile, 
                                                                         ConnectionManager.defaultConfigSchemeFile, 
                                                                         MySQLStorageConfig.prototype), 
                                                                         ConnectionManager.configFile, 
                                                                         ConnectionManager.configSchemeFile,
                                                                         true);

    private static createPool(poolConfig: PoolConfig) {
        Logger.getServerLogger().trace("ConnectionManager.createPool:");

        if (ConnectionManager.pool) {
            ConnectionManager.pool.end();
        }

        ConnectionManager.pool = createPool(poolConfig);
    }

    static {

        ConnectionManager.createPool((ConnectionManager.configManager.getConfiguration() as MySQLStorageConfig).poolConfig);

        ConnectionManager.configManager.listenForConfigurationChange((newConfig: any) => {
            const poolConfig: PoolConfig = (newConfig as MySQLStorageConfig).poolConfig;
            ConnectionManager.createPool(poolConfig);
        });
    
    }

    public static getPool(): Pool {
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

}

export {ConnectionManager, MySQLStorageConfig};
