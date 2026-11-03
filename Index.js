import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const db = new pg.Client ({
    user: "postgres",
    host: "localhost",
    database: "NutriTrack",
    password: "patoduro",
    port: 5432,
});

const app = express();
const port = 3000;

db.conect();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("Public"));

app.post("/Cadastro", async (req, res)=>{
    const nomeUsuario = req.body.nome_usuario;
    const email = req.body.email;
    const senha = req.body.senha;
    try{
        await db.query("INSERT INTO usuario nome_usuario, email, senha VALUES ($1, $2, $3)"[nomeUsuario, email, senha]);
    } catch {
        console.log(err);
    }
} );

app.get("/Cadastro", (req, res)=>{
    res.render("cadastro.html")
});

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}.`);
});