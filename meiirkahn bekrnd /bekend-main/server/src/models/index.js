const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
const usePostgres = Boolean(databaseUrl || process.env.PG_HOST);

const sequelize = usePostgres
  ? new Sequelize(databaseUrl || {
      database: process.env.PG_DATABASE,
      username: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      host: process.env.PG_HOST,
      port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
      dialect: 'postgres',
      logging: false,
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: process.env.SQLITE_STORAGE || path.resolve(__dirname, '../../database.sqlite'),
      logging: false,
    });

const User = require('./user')(sequelize);
const Supply = require('./supply')(sequelize);
const Favorite = require('./favorite')(sequelize);

// Associations
User.hasMany(Supply, { foreignKey: 'createdBy' });
Supply.belongsTo(User, { foreignKey: 'createdBy' });
User.belongsToMany(Supply, { through: Favorite, as: 'favoriteSupplies', foreignKey: 'userId' });
Supply.belongsToMany(User, { through: Favorite, as: 'favoritedBy', foreignKey: 'supplyId' });

module.exports = { sequelize, User, Supply, Favorite };
