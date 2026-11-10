import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import { sensitiveHeaders } from "node:http2";


const db = new pg.Client ({
    user: "postgres",
    host: "localhost",
    database: "NutriTrack",
    password: "Patoduro1!",
    port: 5432,
});

const app = express();
const port = 3000;
const saltRound = 10;

db.connect();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("Public"));

app.get("/", (req,res)=>{
    res.render("index.ejs");
})

app.get("/cadastro", (req, res)=>{
    res.render("cadastro.ejs");
});

app.get("/login", (req, res)=>{
    res.render("login.ejs");
})

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

app.post("/cadastro", async (req, res)=>{
    const nome_usuario = req.body.nome_usuario;
    const email = req.body.email;
    const senha = req.body.senha;

    const checarEmail = await db.query("SELECT id_usuario FROM usuario WHERE LOWER(email) = $1", [email]);
    
    try{
        if(checarEmail.rowCount > 0)
        {
           return res.send("<script>alert('Email já cadastrado'); window.location.href='/cadastro';</script>");
        } else{
            bcrypt.hash(senha, saltRound, async (err, hash)=>{
                if(err){
                    console.log("Erro durante o hash", err);
                } else {
            await db.query("INSERT INTO usuario (nome_usuario, email, senha) VALUES ($1, $2, $3)",[nome_usuario, email, hash]);
            res.render("index.ejs");
        }
        });
                
        }
            } catch {
            console.log("Dados nao enviados");
            return res.send("<script>alert('Cadastro deu errado'); window.location.href='/cadastro';</script>");
                    }
} );

app.post("/login", async (req, res)=>{
    const email = req.body.email;
    const senha = req.body.senha;

    try{
    const resultado = await db.query("SELECT * FROM usuario WHERE LOWER(email) = $1", [email]);
        if(usuario.rows.length > 0){
            const user = resultado.rows[0];
            const senhaChecar = user.senha;
            const idUsuario = user.id_usuario;


            bcrypt.compare(senha, senhaChecar, (err, result)=>{
                if(err){
                    console.log("erro comparando as senhas", err);
                } else {
                    if(result){
                    res.redirect(`/${idUsuario}`);
                    } else {
                        res.send("Senha incorreta");
                    }
                }
            });
        } else {
            res.send("Usuario não cadastrado");
        }
    } catch{
        console.log(err);
    }
});

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}.`);
});