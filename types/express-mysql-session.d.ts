declare module 'express-mysql-session' {
  import * as session from 'express-session';
  import { Pool } from 'mysql2/promise';

  interface MySQLStoreOptions {
    /**
     * Whether or not to create the sessions database table, if one does not already exist.
     */
    createDatabaseTable?: boolean;
    
    /**
     * Database schema configuration for the sessions table.
     */
    schema?: {
      tableName?: string;
      columnNames?: {
        session_id?: string;
        expires?: string;
        data?: string;
      };
    };
    
    /**
     * How often expired sessions should be cleared; milliseconds.
     */
    checkExpirationInterval?: number;
    
    /**
     * The maximum age of a valid session; milliseconds.
     */
    expiration?: number;
  }

  interface MySQLStore extends session.Store {
    new (options: MySQLStoreOptions, connection: Pool): session.Store;
    new (options: MySQLStoreOptions, connectionConfig: any): session.Store;
  }

  function MySQLStoreFactory(session: typeof import('express-session')): {
    new (options: MySQLStoreOptions, connection: Pool): session.Store;
    new (options: MySQLStoreOptions, connectionConfig: any): session.Store;
  };

  export = MySQLStoreFactory;
}