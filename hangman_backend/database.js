// database.js
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize to use SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'), // SQLite file
    logging: true, // Disable logging; remove or set to true for debugging
});

// Define the User model
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    highScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
});

// Sync the model with the database
sequelize.sync()
    .then(() => {
        console.log('Database & tables created!');
    })
    .catch((err) => {
        console.error('Error creating database:', err);
    });

module.exports = { sequelize, User };
