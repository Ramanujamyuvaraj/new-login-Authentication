const express = require("express");

const sqlite3 = require("sqlite3");

const path = require("path");

const dbPath = path.join(__dirname, "userData.db");

const { open } = require("sqlite");

const app = express();

app.use(express.json());

const bCrypt = require("bcrypt");

let db = null;

const initializeDbToServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server successfully running");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDbToServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashedPassword = await bCrypt.hash(password, 7);

  const AddUser = `
    SELECT * 
    FROM user
    WHERE username = "${username}";`;

  const data = await db.get(AddUser);

  if (data === undefined) {
    const createUser = `
        INSERT INTO user(username , name, password, gender, location)
        VALUES ( "${username}" , "${name}" , "${hashedPassword}" , "${gender}" , "${location}");`;

    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const addData = await db.run(createUser);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const loginUser = `
    SELECT * FROM user WHERE username = "${username}";`;

  const userPassword = await db.get(loginUser);

  if (userPassword === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const userId = await bCrypt.compare(password, userPassword.password);

    if (userId === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const getUsersFromDb = `SELECT * FROM user WHERE username = "${username}";`;

  const dataInUser = await db.get(getUsersFromDb);

  if (dataInUser === undefined) {
    response.status(400);
    response.send("Invalid username");
  } else {
    const isValidPassword = await bCrypt.compare(
      oldPassword,
      dataInUser.password
    );

    if (isValidPassword === true) {
      const changeNewPassword = newPassword.length;

      if (changeNewPassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const updatePassword = await bCrypt.hash(newPassword, 10);

        const updateDataBase = `
                UPDATE user
                SET password = "${updatePassword}"
                WHERE username = "${username}";`;

        await db.run(updateDataBase);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
