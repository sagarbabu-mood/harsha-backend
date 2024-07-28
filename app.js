const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { v4 } = require("uuid");
const cors = require("cors");
const databasePath = path.join(__dirname, "transactions.db");
let database = null;
app.use(express.json());
app.use(cors());

const initializeDatabaseAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log(
        "Database and Server has been initialized and running at port number 3000"
      )
    );
  } catch (e) {
    console.log(`Database Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDatabaseAndServer();

//Get Transactions API
app.get("/transactions", async (request, response) => {
  const getTransactionsQuery = `SELECT * FROM transactions`;
  const databaseResponse = await database.all(getTransactionsQuery);
  response.status(200);
  response.send(databaseResponse);
});

const getNewId = async () => {
  const id = await v4().toString();
  const is_id_valid = `SELECT id FROM transactions WHERE id='${id}';`;
  const databaseResponse = await database.get(is_id_valid);
  if (databaseResponse === undefined) {
    return id;
  } else {
    let newId = await v4().toString();
    while (newId !== id) {
      newId = await v4().toString();
    }
    return newId;
  }
};

//Create New Transaction API
app.post("/transaction", async (request, response) => {
  const { transactionType, amount, description } = request.body;
  const transactionId = await getNewId();
  try {
    if (typeof amount === "number") {
      if (typeof description === "string" && description.length > 1) {
        const transactionDate = new Date().toLocaleDateString();
        const createNewTransactionQuery = `INSERT INTO transactions(id,transaction_type, amount, description,date) VALUES('${transactionId}','${transactionType}', ${amount}, '${description}', '${transactionDate}');`;
        await database.run(createNewTransactionQuery);
        response.status(200);
        response.send("success");
      } else {
        response.status(400);
        response.send("description failure");
      }
    } else {
      response.status(400);
      response.send("amount value failure");
    }
  } catch (e) {
    response.status(400);
    response.send("make sure all values are given properly");
  }
});
