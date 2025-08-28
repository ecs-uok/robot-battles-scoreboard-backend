import express from 'express';
import cors from 'cors';

import { initializeApp } from "firebase/app";
import { getDatabase, ref, update, get, child , set } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyC81iHYaSwUCYmnCr1Z6OUS-KRzO5z0AQ0",
  authDomain: "robot-battles-backend.firebaseapp.com",
  databaseURL: "https://robot-battles-backend-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "robot-battles-backend",
  storageBucket: "robot-battles-backend.firebasestorage.app",
  messagingSenderId: "670483214779",
  appId: "1:670483214779:web:7298aebaf8c627b3b4d49e",
  measurementId: "G-6BKXH2PGPE"
  };
const firebase= initializeApp(firebaseConfig);
const database= getDatabase(firebase);

const port = process.env.PORT || 5000;

const app = express();
app.locals.pitOpenTime= 60;
app.locals.controlPage= 1;


app.use(express.json());
app.use(cors());

app.locals.gameDetails={gameId:0,team1:{id:"",name:"",leader:"",score:"",logo:""},team2:{id:"",name:"",leader:"",score:"",logo:""}};
app.locals.team2={};

app.locals.mainTime=0;
app.locals.mainTimeRunner=0;
app.locals.mainTimer;
app.locals.winnerId=null;

function mainCountdown(){
    if (app.locals.mainTimeRunner==0){
        clearInterval(app.locals.mainTimer);
    }else{
        app.locals.mainTimeRunner--;
        if(app.locals.mainTimeRunner<=app.locals.pitOpenTime){
            writePitOpen(true);
        }
    }
    console.log(app.locals.mainTimeRunner);
}

app.locals.pitTime=0;
app.locals.pitTimeRunner=0;
app.locals.pitTimer;
function pitCountdown(){
    if (app.locals.pitTimeRunner==0){
        clearInterval(app.locals.pitTimer);
    }else{
        app.locals.pitTimeRunner--;
    }
    console.log(app.locals.pitTimeRunner);
}

app.post("/setMain", (req, res) =>{
    app.locals.mainTime= req.body.mainTime;
    app.locals.mainTimeRunner= app.locals.mainTime;
    console.log(app.locals.mainTimeRunner);
    writePitOpen(false);
    res.end();
});
app.post("/setPit", (req, res) =>{
    const details= req.body;
    app.locals.pitTime= details.pitTime;
    app.locals.pitTimeRunner= app.locals.pitTime;
    console.log(app.locals.pitTimeRunner);
    res.end();
});
app.post("/setPitOpen", (req, res) =>{
    const details= req.body;
    app.locals.pitOpenTime= details.pitOpenTime;
    res.end();
});
app.post("/setGameDetails",async (req,res)=>{
    const details= req.body;
    app.locals.gameDetails.team1= await getTeamDetails(details.team1);
    app.locals.gameDetails.team2= await getTeamDetails(details.team2);
    app.locals.gameDetails.gameId=details.gameId;
    app.locals.winnerId=null;
    res.end();
})


app.post("/startMain", (req, res) =>{
    clearInterval(app.locals.mainTimer);
    if(app.locals.pitOpenTime<app.locals.mainTimeRunner){
        writePitOpen(false);
    }
    app.locals.mainTimer = setInterval(mainCountdown, 1000);
    res.end();
});

app.post("/startPit", (req, res) =>{
    clearInterval(app.locals.pitTimer);
    app.locals.pitTimer = setInterval(pitCountdown, 1000);
    res.end();
});

app.post("/stopMain",(req,res)=>{
    clearInterval(app.locals.mainTimer);
    res.end();
})

app.post("/stopPit",(req,res)=>{
    clearInterval(app.locals.pitTimer);
    res.end();
})

app.put("/resetMain",(req,res)=>{
    clearInterval(app.locals.mainTimer);
    app.locals.mainTimeRunner=app.locals.mainTime;
    writePitOpen(false);
    res.end();
})

app.put("/resetPit",(req,res)=>{
    clearInterval(app.locals.pitTimer);
    app.locals.pitTimeRunner=app.locals.pitTime;
    res.end();
})

app.get('/timer', (req, res) => {
    res.writeHead(200,{
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    })
    res.write('timer connected');

    setInterval(() => {
        const data= { mainTime:`${app.locals.mainTimeRunner}`, pitTime:`${app.locals.pitTimeRunner}`, gameId:`${app.locals.gameDetails.gameId}`, team1Id:`${app.locals.gameDetails.team1.id}`, team2Id:`${app.locals.gameDetails.team2.id}`, winnerId:`${app.locals.winnerId}`}
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 1000);
    // Close the connection when the client disconnects
    req.on('close', () => res.end('OK'))
});

app.get("/gameId", (req,res)=>{
    res.writeHead(200,{
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    })
    res.write('timer connected'); 

    setInterval(() => {
        const data= { gameId:`${app.locals.gameId}`}
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 1000);
    // Close the connection when the client disconnects
    req.on('close', () => res.end('OK'))
})

app.get("/nextGameId", async (req,res)=>{
    const body= await getGameCount();
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(JSON.stringify(body));
    res.end();
})

app.get("/getGameDetails", (req,res)=>{
    const body= app.locals.gameDetails
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(JSON.stringify(body));
    res.end();
})

app.get("/teams", async(req,res)=>{
    const body= await getTeams();
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(JSON.stringify(body));
    res.end();
})

app.get("/games", async(req,res)=>{
    const body= await getAllGames();
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(JSON.stringify(body));
    res.end();
})

app.post("/saveGame", async(req,res)=>{
    const content  = req.body;
    const body= await saveGame(app.locals.gameDetails.gameId,app.locals.gameDetails.team1.name, app.locals.gameDetails.team2.name, content.team1score, content.team2score);
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(JSON.stringify(body));
    res.end();
})

//Database actions
function writePitOpen(stat){
    update(ref(database,'/'),{
        pitopen: stat
    });
}

async function getGameCount(){
    const dbRef = ref(database);
    return await get(child(dbRef, `games`)).then((snapshot) => {
    if (snapshot.exists()) {
        let count= snapshot.size +1
        return {gameId:count};
    } else {
        console.log("No data available");
        return {gameId:""}
    }
    }).catch((error) => {
        console.error(error);
        return {gameId:""}
    });
}
async function getTeamDetails(teamid){
    const dbRef = ref(database);
    console.log(teamid)
    return await get(child(dbRef, `teams/${teamid}`)).then((snapshot) => {
    if (snapshot.exists()) {
        let team= snapshot.val();
        team={id:teamid,name:team.name,leader:team.leader,score:"",logo:team.logo}
        console.log(team)
        return team;
    } else {
        console.log("No data available");
        return {id:"",name:"",leader:"",score:"",logo:""}
    }
    }).catch((error) => {
        console.error(error);
        return {id:"",name:"",leader:"",score:"",logo:""}
    });
    
}

async function getTeams(){
    const dbRef = ref(database);
    return await get(child(dbRef, `teams/`)).then((snapshot) => {
    if (snapshot.exists()) {
        return snapshot.val();
    } else {
        console.log("No data available");
        return {}
    }
    }).catch((error) => {
        console.error(error);
        return {}
    });
}

async function getAllGames(){
    const dbRef = ref(database);
    return await get(child(dbRef, `games/`)).then((snapshot) => {
    if (snapshot.exists()) {
        return snapshot.val();
    } else {
        console.log("No data available");
        return {}
    }
    }).catch((error) => {
        console.error(error);
        return {}
    });
}

async function saveGame(gameId,team1name,team2name,team1score,team2score){
    // Expanded game summary log
    console.log(
        `Game Summary:\n` +
        `  Game ID: ${gameId}\n` +
        `  Team 1: ${team1name} (ID: ${app.locals.gameDetails.team1.id}) - Score: ${team1score}\n` +
        `  Team 2: ${team2name} (ID: ${app.locals.gameDetails.team2.id}) - Score: ${team2score}`
    );
    if(gameId && team1name && team2name && team1score != null && team2score != null){
        // Ensure scores are numbers for correct comparison
        const t1score = Number(team1score);
        const t2score = Number(team2score);
        let winnerId = 0;
        let winnerMsg = "";
        if(t1score > t2score){
            winnerId = app.locals.gameDetails.team1.id;
            app.locals.winnerId = winnerId;
            await postWinnerPoints(winnerId, 3);
            winnerMsg = `Winner: ${app.locals.gameDetails.team1.name} (ID: ${winnerId})`;
        }else if(t2score > t1score){
            winnerId = app.locals.gameDetails.team2.id;
            app.locals.winnerId = winnerId;
            await postWinnerPoints(winnerId, 3);
            winnerMsg = `Winner: ${app.locals.gameDetails.team2.name} (ID: ${winnerId})`;
        }else{
            winnerId = 0;
            app.locals.winnerId = 0;
            winnerMsg = "It's a draw. No winner.";
        }
        await set(ref(database, 'games/' + (gameId-1)), {
            gameid: ""+gameId,
            team1name: ""+team1name,
            team1score : ""+team1score,
            team2name: ""+team2name,
            team2score: ""+team2score,
            winnerId: winnerId
        })
        console.log(winnerMsg); // Only print once after DB update
        return {message:"Saved Scores Successfuly"};
    }else{
        return {message:"Game details not set!"}
    }
}

// Helper to update winner's points in the database
async function postWinnerPoints(teamId, pointsToAdd) {
    if (!teamId) return;
    const dbRef = ref(database);
    const teamRef = child(dbRef, `teams/${teamId}`);
    let currentPoints = 0;
    try {
        const snapshot = await get(teamRef);
        if (snapshot.exists()) {
            const team = snapshot.val();
            currentPoints = parseInt(team.points || 0, 10);
        }
    } catch (e) {
        currentPoints = 0;
    }
    await update(ref(database, `teams/${teamId}`), {
        points: currentPoints + pointsToAdd
    });
}

app.listen(port, ()=> {console.log(`Server started on port ${port}`)})