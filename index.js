require("dotenv").config();

const fs = require("fs");
const QRCode = require("qrcode");

const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    ChannelType
} = require("discord.js");


// =======================
// CLIENT
// =======================

const client = new Client({

    intents: [

        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent

    ],

    partials:[

        Partials.Channel

    ]

});


// =======================
// CONFIG
// =======================

const prefix = "!";

const tickets = new Map();

const joins = [];

const PIX_FILE = "./pix.json";


// =======================
// PIX SISTEMA
// =======================

function criarArquivoPix(){

    if(!fs.existsSync(PIX_FILE)){

        fs.writeFileSync(

            PIX_FILE,

            JSON.stringify({

                chave:""

            }, null, 4)

        );

    }

}



function carregarPix(){

    criarArquivoPix();


    return JSON.parse(

        fs.readFileSync(

            PIX_FILE,

            "utf8"

        )

    );

}



function salvarPix(chave){


    fs.writeFileSync(

        PIX_FILE,

        JSON.stringify({

            chave: chave

        }, null, 4)

    );


}




// =======================
// BOT ONLINE
// =======================

client.once("clientReady",()=>{


    console.log(
        `✅ Bot online como ${client.user.tag}`
    );


});





// =======================
// FUNÇÃO LOG
// =======================

async function enviarLog(guild,texto){


    const canal =
    guild.channels.cache.get(
        process.env.CANAL_LOG
    );


    if(!canal)
        return;



    const embed =
    new EmbedBuilder()

    .setTitle("📋 Log")

    .setDescription(texto)

    .setColor("#000000")

    .setTimestamp();



    canal.send({

        embeds:[embed]

    }).catch(()=>{});


}




// =======================
// PERMISSÃO ADMIN
// =======================

function isAdmin(member){


    if(!member)
        return false;



    return member.roles.cache.has(

        process.env.CARGO_ADMIN

    );


}




// =======================
// TRATAMENTO DE ERRO
// =======================

process.on(
    "unhandledRejection",
    (error)=>{

        console.log(
            "Erro tratado:",
            error
        );

    }
);


process.on(
    "uncaughtException",
    (error)=>{

        console.log(
            "Erro:",
            error
        );

    }
);