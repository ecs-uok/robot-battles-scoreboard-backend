const express= require('express');
const cors= require('cors');
const app = express();
app.use(express.json());
app.use(cors());

app.locals.team1;
app.locals.team2;

app.locals.mainTime=0;
app.locals.mainTimeRunner=0;
app.locals.mainTimer;
function mainCountdown(){
    if (app.locals.mainTimeRunner==0){
        clearInterval(app.locals.mainTimer);
    }else{
        app.locals.mainTimeRunner--;
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
    res.end();
});
app.post("/setPit", (req, res) =>{
    const details= req.body;
    app.locals.pitTime= details.pitTime;
    app.locals.pitTimeRunner= app.locals.pitTime;
    console.log(app.locals.pitTimeRunner);
    res.end();
});
app.post("/startMain", (req, res) =>{
    app.locals.mainTimer = setInterval(mainCountdown, 1000);
    res.end();
});

app.post("/startPit", (req, res) =>{
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
        const data= { mainTime:`${app.locals.mainTimeRunner}`, pitTime:`${app.locals.pitTimeRunner}`}
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 1000);
    // Close the connection when the client disconnects
    req.on('close', () => res.end('OK'))
});

app.get("/teams", (req,res)=>{
    res.json({"users": ["user1","user2"]});
})

app.listen(5000, ()=> {console.log("Server started on port 5000")})