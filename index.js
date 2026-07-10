require("dotenv").config();

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

const QRCode = require("qrcode");


const client = new Client({

    intents: [

        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent

    ],

    partials: [

        Partials.Channel

    ]

});


// =======================
// CONFIG
// =======================

const prefix = "!";

const tickets = new Map();

const joins = [];


// =======================
// BOT ONLINE
// =======================

client.once("clientReady", () => {

    console.log(`✅ Bot online como ${client.user.tag}`);

});


// =======================
// LOGS
// =======================

async function log(guild, texto){

    const canal = guild.channels.cache.get(
        process.env.CANAL_LOG
    );


    if(!canal) return;


    const embed = new EmbedBuilder()

    .setTitle("📋 Log do Bot")

    .setDescription(texto)

    .setColor("#000000")

    .setTimestamp();


    canal.send({

        embeds:[embed]

    });

}



// =======================
// ANTI RAID
// =======================

client.on("guildMemberAdd", async(member)=>{


    if(process.env.ANTI_RAID !== "true")
        return;



    const agora = Date.now();


    joins.push(agora);



    while(
        joins.length &&
        agora - joins[0] > 10000
    ){

        joins.shift();

    }



    if(joins.length >= 5){


        await log(
            member.guild,
            `🚨 Possível raid detectado.\nMuitos membros entrando rapidamente.`
        );



        try{

            await member.timeout(
                600000,
                "Anti Raid"
            );

        }catch(e){}



    }


});




// =======================
// COMANDO !TICKET
// =======================

client.on("messageCreate", async(message)=>{


    if(message.author.bot)
        return;



    if(message.content === "!ticket"){



        const embed = new EmbedBuilder()

        .setTitle("🎫 Central de Atendimento")

        .setDescription(
            "Clique no botão abaixo para abrir um ticket."
        )

        .setColor("#000000");



        const button = new ButtonBuilder()

        .setCustomId("abrir_ticket")

        .setLabel("Abrir Ticket")

        .setEmoji("🎫")

        .setStyle(ButtonStyle.Success);



        const row = new ActionRowBuilder()

        .addComponents(button);



        message.channel.send({

            embeds:[embed],

            components:[row]

        });


    }


});




// =======================
// INTERAÇÕES
// =======================

client.on("interactionCreate", async(interaction)=>{


    if(!interaction.isButton())
        return;



    if(interaction.customId === "abrir_ticket"){



        await interaction.deferReply({
            ephemeral:true
        });



        if(tickets.has(interaction.user.id)){


            return interaction.editReply({

                content:
                "❌ Você já possui um ticket aberto."

            });


        }




        let categoria =
        interaction.guild.channels.cache.get(
            process.env.CATEGORIA_TICKET
        );



        if(!categoria){


            categoria =
            await interaction.guild.channels.create({

                name:"🎫 TICKETS",

                type:ChannelType.GuildCategory

            });


        }




        const canal =
await interaction.guild.channels.create({

    name: `ticket-${interaction.user.username}`,

    type: ChannelType.GuildText,

    parent: categoria.id,

    permissionOverwrites: [
        {
            id: interaction.guild.id,
            deny: [
                PermissionsBitField.Flags.ViewChannel
            ]
        },
        {
            id: interaction.user.id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages
            ]
        }
    ]

});


tickets.set(
    interaction.user.id,
    canal.id
);


const qr =
await QRCode.toBuffer(
    process.env.CHAVE_PIX
);



        const embed =
        new EmbedBuilder()


        .setTitle("🛒 Compra")

        .setDescription(

`
Olá ${interaction.user}!

Realize o pagamento pelo PIX:

\`${process.env.CHAVE_PIX}\`

Envie o comprovante aqui.
`

        )

        .setColor("#00FF00");




        await canal.send({

            embeds:[embed],

            files:[{

                attachment:qr,

                name:"pix.png"

            }]

        });




        await interaction.editReply({

            content:
            `✅ Ticket criado: ${canal}`

        });



        log(
            interaction.guild,
            `🎫 Ticket criado por ${interaction.user}`
        );


    }


});

// =======================
// CONFIRMAR PAGAMENTO
// =======================

client.on("messageCreate", async(message)=>{


    if(message.author.bot)
        return;



    if(message.content === "!confirmar"){



        if(
            !message.member.roles.cache.has(
                process.env.CARGO_ADMIN
            )
        ){

            return message.reply(
                "❌ Você não tem permissão para usar esse comando."
            );

        }



        const embed = new EmbedBuilder()

        .setTitle("✅ Pagamento Confirmado")

        .setDescription(
            `Pagamento confirmado por ${message.author}`
        )

        .setColor("#00FF00")

        .setTimestamp();



        message.channel.send({

            embeds:[embed]

        });



        log(
            message.guild,
            `💰 ${message.author} confirmou um pagamento em ${message.channel}`
        );


    }


});





// =======================
// LOCK / UNLOCK
// =======================

client.on("messageCreate", async(message)=>{


    if(message.author.bot)
        return;



    if(
        !message.content.startsWith(prefix)
    )
        return;



    if(
        !message.member.roles.cache.has(
            process.env.CARGO_ADMIN
        )
    )
        return;



    const comando =
    message.content
    .slice(1)
    .split(" ")[0];





    if(comando === "lock"){


        await message.channel.permissionOverwrites.edit(

            message.guild.id,

            {

                SendMessages:false

            }

        );



        message.reply(
            "🔒 Canal bloqueado."
        );


        log(
            message.guild,
            `🔒 ${message.author} bloqueou ${message.channel}`
        );


    }




    if(comando === "unlock"){



        await message.channel.permissionOverwrites.edit(

            message.guild.id,

            {

                SendMessages:true

            }

        );



        message.reply(
            "🔓 Canal desbloqueado."
        );


        log(
            message.guild,
            `🔓 ${message.author} desbloqueou ${message.channel}`
        );


    }


});





// =======================
// FECHAR TICKET
// =======================

client.on("messageCreate", async(message)=>{


    if(message.author.bot)
        return;



    if(message.content === "!fechar"){



        if(
            !message.channel.name.startsWith("ticket-")
        ){

            return message.reply(
                "❌ Esse comando só funciona em tickets."
            );

        }



        message.reply(
            "🗑️ Fechando ticket em 5 segundos..."
        );



        setTimeout(()=>{


            message.channel.delete()
            .catch(()=>{});



        },5000);



        log(
            message.guild,
            `🗑️ Ticket fechado por ${message.author}`
        );


    }


});




// =======================
// STATUS
// =======================

client.on("messageCreate", async(message)=>{


    if(message.author.bot)
        return;



    if(message.content === "!status"){



        message.reply({

            embeds:[

                new EmbedBuilder()

                .setTitle("🤖 Status do Bot")

                .setDescription(
`
🟢 Online

Ping:
${client.ws.ping}ms
`
                )

                .setColor("#00FF00")

            ]

        });


    }


});





// =======================
// LOGIN
// =======================

client.login(
    process.env.TOKEN
);