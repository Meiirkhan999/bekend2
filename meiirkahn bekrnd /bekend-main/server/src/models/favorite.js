const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Favorite', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    supplyId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'supplyId'],
      },
    ],
  });
};
