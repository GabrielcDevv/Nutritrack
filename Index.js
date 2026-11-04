import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const db = new pg.Client ({
    user: "postgres",
    host: "localhost",
    database: "NutriTrack",
    password: "Patoduro1!",
    port: 5432,
});

const app = express();
const port = 3000;

db.connect();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("Public"));

app.post("/cadastro", async (req, res)=>{
    const nomeUsuario = req.body.nome_usuario;
    const email = req.body.email;
    const senha = req.body.senha;
    try{
        await db.query("INSERT INTO usuario nome_usuario, email, senha VALUES ($1, $2, $3)"[nomeUsuario, email, senha]);
    } catch {
        console.log(err);
    }
} );
app.get("/", (req,res)=>{
    res.render("home.ejs");
})

app.get("/cadastro", (req, res)=>{
    res.render("cadastro.ejs");
});

app.get("/cronograma:id", async (req,res)=>{
        const id_usuario = req.params.id_usuario;
        const diaSemana = req.body.id_dia;
        const horario = req.body.id_horario;
    try{
        await db.query("SELECT * FROM usuario_alimento_dia_horario WHERE id_usuario = $1, id_dia = $2, id_horario =  $3"[id_usuario,diaSemana,horario]);
        res.render("cronograma.ejs");
    } catch{
        console.log(err);
    }
});

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}.`);
});