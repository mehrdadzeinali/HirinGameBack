require('dotenv').config();

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    },
    migrations: {
      directory: './src/db/migrations'
    }
  },

  test: {
    client: 'mysql2',
    connection: {
      host: process.env.TEST_DB_HOST,
      user: process.env.TEST_DB_USER,
      password: process.env.TEST_DB_PASSWORD,
      database: process.env.TEST_DB_NAME
    },
    migrations: {
      directory: './src/db/migrations'
    }
  },

  staging: {
    client: 'mysql2',
    connection: {
      host: process.env.STAGING_DB_HOST,
      user: process.env.STAGING_DB_USER,
      password: process.env.STAGING_DB_PASSWORD,
      database: process.env.STAGING_DB_NAME
    },
    migrations: {
      directory: './src/db/migrations'
    }
  },

  production: {
    client: 'mysql2',
    connection: {
      host: process.env.PROD_DB_HOST,
      user: process.env.PROD_DB_USER,
      password: process.env.PROD_DB_PASSWORD,
      database: process.env.PROD_DB_NAME
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './src/db/migrations'
    }
  }
};
