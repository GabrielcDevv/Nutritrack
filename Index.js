import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";


const db = new pg.Client ({
    user: "postgres",
    host: "host.docker.internal",
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

function calculoCalorico(genero, peso, altura, idade){
    if(genero == "masculino"){
        const gastoRepouso = ( 10 * peso) + (6.25 * altura) - (5 * idade) + 5;
        return gastoRepouso;
    } else{
        const gastoRepouso = (10 * peso) + (6.25 * altura) - (5 * idade) - 161
        return gastoRepouso;
    }
};

app.get("/", (req,res)=>{
    res.render("login.ejs");
})

app.get("/cadastro", (req, res)=>{
    res.render("cadastro.ejs");
});


app.get("/cronograma", async (req,res)=>{

    try{
    const id = req.user.id_usuario;
    const result = await db.query("Select genero, idade, altura_cm, peso_atual FROM usuario WHERE id_usuario = $1", [id]);
    const user = result.rows[0];

    const gastoRepouso = calculoCalorico(user.genero, user.peso_atual, user.altura_cm, user.idade);

    const usuarioExercicios = await db.query("SELECT descricao, intensidade FROM exercicios as e JOIN exercicios_usuario as eu on e.id_exercicio = eu.id_exercicio WHERE id_usuario = $1", [id]);
    const usuarioMet =  usuarioExercicios.rows;

    const diaSemana = await  db.query("SELECT dia FROM dia_semana");
    const resultadoDia = diaSemana.rows;
    
    res.render("cronograma.ejs", 
        {gastoRepouso: gastoRepouso,
         usuarioExercicios: usuarioMet,
         resultadoDia: resultadoDia 
        });
    } catch (err){
        console.log(err);
    }
});

app.post("/cadastro", async (req, res)=>{
    const nome_usuario = req.body.nome_usuario;
    const email = req.body.email;
    const senha = req.body.senha;
    const genero = req.body.genero;
    const idade = req.body.idade;
    const altura = req.body.altura;
    const peso = req.body.peso;


    const checarEmail = await db.query("SELECT id_usuario FROM usuario WHERE LOWER(email) = $1", [email]);
    
    try{
        if(checarEmail.rowCount > 0)
        {
            return res.send("<script>alert('Email já cadastrado'); window.location.href='/';</script>");
        } else{
            bcrypt.hash(senha, saltRound, async (err, hash)=>{
                if(err){
                    console.log("Erro durante o hash", err);
                } else {
            const result = await db.query("INSERT INTO usuario (nome_usuario, email, senha, idade, genero, altura_cm, peso_atual) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",[nome_usuario, email, hash, idade, genero, altura, peso]);
           const user = result.rows[0];
           req.login(user, (err)=>{
            console.log(err);
            res.redirect("/cronograma");
           });
        }
        });     
        }
            } catch(err) {
            console.log("Dados nao enviados");
            return res.send("<script>alert('Cadastro deu errado'); window.location.href='/cadastro';</script>");
                    }
} );

app.post("/", passport.authenticate("local", {
    successRedirect: "/cronograma",
    failureRedirect: "/",
}));

app.post("/cronograma", async (req,res)=>{
});

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