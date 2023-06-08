const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerCamel = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchCamel = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayers = `SELECT * FROM player_details`;
  const players = await db.all(getPlayers);
  response.send(players.map((eachPlayer) => convertPlayerCamel(eachPlayer)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayers = `SELECT * FROM player_details WHERE player_id = ${playerId}`;
  const players = await db.get(getPlayers);
  response.send(players.map((eachPlayer) => convertPlayerCamel(eachPlayer)));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details 
     SET player_name = ${playerName}
     WHERE player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayers = `SELECT * FROM match_details WHERE match_id = ${matchId}`;
  const players = await db.get(getPlayers);
  response.send(convertMatchCamel(players));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerId = `SELECT * FROM match_details NATURAL JOIN player_match_score
    WHERE player_id = ${playerId};`;
  const player = await db.all(getMatchPlayerId);
  response.send(player.map((eachPlayer) => convertMatchCamel(eachPlayer)));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerId = `SELECT * FROM player_details NATURAL JOIN player_match_score
    WHERE match_id = ${matchId};`;
  const player = await db.all(getMatchPlayerId);
  response.send(player.map((eachPlayer) => convertPlayerCamel(eachPlayer)));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getTotals = `SELECT 
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_details NATURAL JOIN player_match_score 
    WHERE player_id = ${playerId};`;
  const playerScores = await db.get(getTotals);
  response.send(playerScores);
});
module.exports = app;
