const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "./userData.db");
let db = null;

const installDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At Port :3000");
    });
  } catch (e) {
    console.log(e.message);
  }
};

installDBAndServer();

// API 1. POST user

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const getUserDetails = `SELECT * FROM user WHERE username = '${username}'`;
  const userDetails = await db.get(getUserDetails);
  if (userDetails === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashingPassword = await bcrypt.hash(password, 10);
      const postUserQuery = `
            INSERT INTO user(username,name,password,gender,location)
            VALUES ('${username}','${name}', '${hashingPassword}', '${gender}', '${location}');
          `;
      await db.run(postUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// API 2. POST login
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const getUserDetails = `SELECT * FROM user WHERE username = '${username}'`;
  const userDetails = await db.get(getUserDetails);

  if (userDetails === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const validatingPassword = await bcrypt.compare(
      password,
      userDetails.password
    );
    if (validatingPassword) {
        response.send("Login success!")
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API 3. PUT change Password

app.put("/change-password/",async (request,response) => {
    const {username, oldPassword, newPassword} = request.body;

    const getUserDetails = `SELECT * FROM user WHERE username = '${username}'`;
  const userDetails = await db.get(getUserDetails);

    const validation = await bcrypt.compare(oldPassword,userDetails.password);
    if(validation){
        if(newPassword.length < 5){
            response.status(400)
            response.send("Password is too short")
        }else{
            const hashedPassword = await bcrypt.hash(newPassword,10);

            const putPasswordQuery = `
                UPDATE user 
                SET 
                    password = '${hashedPassword}'
                WHERE username = '${username}';
            `

            await db.run(putPasswordQuery);
            response.send("Password updated")
        }
    }else{
        response.status(400);
        response.send("Invalid current password")
    }
})


module.exports = app;