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

// =======================
// PAINEL DE TICKET
// =======================

client.on("messageCreate", async(message)=>{


    if(message.author.bot)
        return;


    if(message.content !== "!ticket")
        return;



    const embed =
    new EmbedBuilder()

    .setTitle("🎫 Central de Atendimento")

    .setDescription(
        "Clique no botão abaixo para abrir seu ticket."
    )

    .setColor("#000000");



    const botao =
    new ButtonBuilder()

    .setCustomId("abrir_ticket")

    .setLabel("Abrir Ticket")

    .setEmoji("🎫")

    .setStyle(ButtonStyle.Success);



    const row =
    new ActionRowBuilder()

    .addComponents(botao);



    await message.channel.send({

        embeds:[embed],

        components:[row]

    });


});





// =======================
// BOTÃO ABRIR TICKET
// =======================

client.on("interactionCreate", async(interaction)=>{


    if(!interaction.isButton())
        return;



    if(interaction.customId !== "abrir_ticket")
        return;



    await interaction.deferReply({

        ephemeral:true

    });




    if(tickets.has(interaction.user.id)){


        return interaction.editReply({

            content:
            "❌ Você já possui um ticket aberto."

        });


    }



    try{


        let categoria =
        interaction.guild.channels.cache.find(

            c =>
            c.name === "🎫 TICKETS" &&
            c.type === ChannelType.GuildCategory

        );



        if(!categoria){


            categoria =
            await interaction.guild.channels.create({

                name:"🎫 TICKETS",

                type:ChannelType.GuildCategory

            });


        }




        const permissoes = [


            {

                id:
                interaction.guild.id,


                deny:[

                    PermissionsBitField.Flags.ViewChannel

                ]

            },


            {

                id:
                interaction.user.id,


                allow:[

                    PermissionsBitField.Flags.ViewChannel,

                    PermissionsBitField.Flags.SendMessages,

                    PermissionsBitField.Flags.ReadMessageHistory

                ]

            }


        ];



        const cargo =
        interaction.guild.roles.cache.get(
            process.env.CARGO_ADMIN
        );



        if(cargo){


            permissoes.push({

                id:cargo.id,

                allow:[

                    PermissionsBitField.Flags.ViewChannel,

                    PermissionsBitField.Flags.SendMessages,

                    PermissionsBitField.Flags.ReadMessageHistory

                ]

            });


        }




        const canal =
        await interaction.guild.channels.create({

            name:
            `ticket-${interaction.user.username}`,

            type:
            ChannelType.GuildText,


            parent:
            categoria.id,


            permissionOverwrites:
            permissoes


        });




        tickets.set(

            interaction.user.id,

            canal.id

        );




        const pix =
        carregarPix();



        const embed =
        new EmbedBuilder()

        .setTitle("🛒 Compra")

        .setDescription(

`
Olá ${interaction.user}!

Envie o comprovante após realizar o pagamento.

${pix.chave ? 
`💳 PIX:
\`${pix.chave}\`` 
:
"⚠️ PIX ainda não configurado."}

`

        )

        .setColor("#00FF00")

        .setTimestamp();




        if(pix.chave){


            const qr =
            await QRCode.toBuffer(

                pix.chave

            );



            await canal.send({

                embeds:[embed],

                files:[{

                    attachment:qr,

                    name:"pix.png"

                }]

            });



        }else{


            await canal.send({

                embeds:[embed]

            });


        }




        await interaction.editReply({

            content:

            `✅ Ticket criado: ${canal}`

        });



        enviarLog(

            interaction.guild,

            `🎫 Ticket criado por ${interaction.user}`

        );



    }catch(error){


        console.log(error);



        await interaction.editReply({

            content:
            "❌ Ocorreu um erro ao criar o ticket."

        });


    }


});

// =======================
// LOGIN BOT
// =======================

client.login(process.env.TOKEN)
.then(() => {

    console.log("🔑 Token aceito, conectando...");

})
.catch((err)=>{

    console.log("❌ Erro no login:", err);

});