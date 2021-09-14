var Sequelize = require("sequelize");
const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "postgres",
  operatorsAliases: false,

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const Task = sequelize.define("task", {
  title: Sequelize.STRING,

  description: Sequelize.TEXT,

  status: Sequelize.STRING,
});

Task.belongsToMany(Task, {
  through: "child_task",
  as: "tasks",
  foreignKey: "task_id",
});

module.exports = {
  Task,
};
