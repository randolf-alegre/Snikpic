const express = require("express");
const http = require("http");
const app = express();
const port = 3100;
const Task = require("./database");
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server);

app.patch("/updateTask", async (req, res) => {
  try {
    const { id } = req.body;

    const task = await Task.findByPk(id, {
      include: [
        {
          model: Task,
          as: "tasks",
          attributes: ["id", "title", "description", "status"],
          through: {
            attributes: [],
          },
        },
      ],
    });

    isUpdateable = false;
    task.tasks.forEach((task) => {
      if (task && task.status === "To do") {
        isUpdateable = true;
      }
    });

    if (isUpdateable) {
      await Task.update({
        status: "Done",
      });
    }

    return res.status(200).json({
      status: 200,
      data: "updated successfully.",
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      data: error.message,
    });
  }
});

app.post("/createTask", async (req, res) => {
  try {
    const { title, description, parentIds } = req.body;
    let status = "To do";

    if (parentIds && parentIds.length) {
      let isFound = false;

      for (let index = 0; index < parentIds.length && isFound; index++) {
        const id = parentIds[index];

        const task = await Task.findByPk(id, {
          include: [
            {
              model: Task,
              as: "tasks",
              attributes: ["id", "title", "description", "status"],
              through: {
                attributes: [],
              },
            },
          ],
        });

        const isExist = task.tasks.find((task) => task.status !== "Done");
        if (isExist) {
          status = "Not open yet";
        }
      }
    }

    const response = await Task.create({
      title,
      description,
      parentIds,
      status,
    });

    return res.status(201).json({
      status: 201,
      data: response,
    });
  } catch (error) {
    return res.status(400).json({
      status: 400,
      data: error.message,
    });
  }
});

io.on("connection", (socket) => {
  socket.on("task_list", async function (data) {
    try {
      const taskId = data.taskId;
      const task = await Task.findByPk(taskId, {
        include: [
          {
            model: Task,
            as: "tasks",
            attributes: ["id", "title", "description", "status"],
            through: {
              attributes: [],
            },
          },
        ],
      });

      isUpdateable = false;
      task.tasks.forEach((childTask) => {
        if (childTask && childTask.status === "Done") {
          isUpdateable = true;
        }
      });

      if (isUpdateable) {
        await Task.update(
          {
            status: "To do",
          },
          { where: { _id: taskId } }
        );
      }

      io.emit("task_updates", { tasks: task.tasks });
    } catch (error) {
      io.emit("error");
    }
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(port, () => {
  console.log("listening on *" + port);
});
