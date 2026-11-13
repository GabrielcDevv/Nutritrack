import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";


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

app.use(session({
    secret: "Tantofazisso",
    resave: false,
    saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24,
        },
}));

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req,res)=>{
    res.render("login.ejs");
})

app.get("/cadastro", (req, res)=>{
    res.render("cadastro.ejs");
});


app.get("/cronograma", async (req,res)=>{
        if(req.isAuthenticated()){
                const id_usuario = req.user.id_usuario;
                const diaSemana = req.body.id_dia;
                const horario = req.body.id_horario;
            try{
                await db.query("SELECT * FROM usuario_alimento_dia_horario WHERE id_usuario = $1, id_dia = $2, id_horario =  $3"[id_usuario,diaSemana,horario]);
                res.redirect("/");
            } catch{
                console.log(err);
            }
        } else{
            res.redirect("/");
        }
});

app.post("/cadastro", async (req, res)=>{
    const nome_usuario = req.body.nome_usuario;
    const email = req.body.email;
    const senha = req.body.senha;
    const genero = req.body.genero;
    const idade = req.body.idade;

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
            const result = await db.query("INSERT INTO usuario (nome_usuario, email, senha, idade, genero) VALUES ($1, $2, $3, $4, $5) RETURNING *",[nome_usuario, email, hash, idade, genero]);
           const user = result.rows[0];
           req.login(user, (err)=>{
            console.log(err);
            res.redirect("/");
           });
        }
        });
                
        }
            } catch {
            console.log("Dados nao enviados");
            return res.send("<script>alert('Cadastro deu errado'); window.location.href='/cadastro';</script>");
                    }
} );

app.post("/", passport.authenticate("local", {
    successRedirect: "/cronograma",
    failureRedirect: "/",
}));

passport.use(new Strategy({
    usernameField: 'email',
    passwordField:'senha'
}, async function verify(email, senha, cb){
     try{
        const resultado = await db.query("SELECT * FROM usuario WHERE (email) = $1", [email]);

        if(resultado.rows.length > 0){
            const user = resultado.rows[0];
            const senhaChecar = user.senha;

            bcrypt.compare(senha, senhaChecar, (err, result)=>{
                if(err){
                   return cb(err);
                } else {
                    if(result){
                    return cb(null, user);
                    } else {
                        return cb(null, false);
                    }
                }
            });
        } else {
            return cb("Usuario não cadastrado");
        }
    } catch(err){
        return cb(err);
    }
}));

passport.serializeUser((user, cb)=>{
    cb(null, user);
});

passport.deserializeUser((user, cb)=>{
    cb(null, user);
});

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}.`);
});