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
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [
        Partials.Channel
    ]
});


const prefix = "!";

const joins = [];


// ===============================
// BOT ONLINE
// ===============================

client.once("ready", () => {
    console.log(`✅ Bot online como ${client.user.tag}`);
});


// ===============================
// LOG
// ===============================

async function enviarLog(guild, texto){

    const canal = guild.channels.cache.get(
        process.env.CANAL_LOG
    );

    if(!canal) return;

    const embed = new EmbedBuilder()
    .setTitle("📌 Log do Bot")
    .setDescription(texto)
    .setColor("#FF0000")
    .setTimestamp();

    canal.send({
        embeds:[embed]
    });
}


// ===============================
// ANTI RAID
// ===============================

client.on("guildMemberAdd", async(member)=>{

    if(process.env.ANTI_RAID !== "true") return;


    const agora = Date.now();

    joins.push(agora);


    while(
        joins.length &&
        agora - joins[0] > 10000
    ){
        joins.shift();
    }


    if(joins.length >= 5){

        await enviarLog(
            member.guild,
            "🚨 Possível raid detectado! Muitas entradas em pouco tempo."
        );


        try{

            await member.timeout(
                600000,
                "Proteção Anti Raid"
            );

        }catch(e){}

    }

});


// ===============================
// CRIAR PAINEL DE TICKET
// ===============================

client.on("messageCreate", async(message)=>{


if(message.author.bot) return;



if(message.content === "!ticket"){


const embed = new EmbedBuilder()

.setTitle("🎫 Suporte / Compra")

.setDescription(
" clique no botão abaixo para abrir um ticket de compra."
)

.setColor("#000000")



const button = new ButtonBuilder()

.setCustomId("abrir_ticket")

.setLabel("Abrir Ticket")

.setStyle(ButtonStyle.Success);



const row = new ActionRowBuilder()
.addComponents(button);



message.channel.send({

embeds:[embed],

components:[row]

});


}



});



// ===============================
// BOTÕES
// ===============================


client.on("interactionCreate", async(interaction)=>{


if(!interaction.isButton()) return;



if(interaction.customId === "abrir_ticket"){



const canal = await interaction.guild.channels.create({

name:`ticket-${interaction.user.username}`,

type:ChannelType.GuildText,


permissionOverwrites:[

{
id:interaction.guild.id,

deny:[
PermissionsBitField.Flags.ViewChannel
]

},

{
id:interaction.user.id,

allow:[
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages
]

}

]


});



const qr = await QRCode.toDataURL(
process.env.CHAVE_PIX
);



const embed = new EmbedBuilder()

.setTitle("🛒 Compra")

.setDescription(

`Olá ${interaction.user}!

Envie o comprovante após o pagamento.

💰 PIX:

\`${process.env.CHAVE_PIX}\`

Use o QR Code abaixo.`

)

.setColor("#00FF00")

.setImage("attachment://pix.png");



canal.send({

embeds:[embed],

files:[

{

attachment:
Buffer.from(
qr.split(",")[1],
"base64"
),

name:"pix.png"

}

]


});



interaction.reply({

content:`Ticket criado: ${canal}`,

ephemeral:true

});


}


});




// ===============================
// CONFIRMAR PAGAMENTO
// ===============================


client.on("messageCreate", async(message)=>{


if(message.author.bot) return;


if(message.content === "!confirmar"){



if(
!message.member.roles.cache.has(
process.env.CARGO_ADMIN
)

){

return message.reply(
"❌ Você não tem permissão."
);

}



message.channel.send(
"✅ Pagamento confirmado!"
);


await enviarLog(
message.guild,
`${message.author} confirmou uma compra em ${message.channel}`
);


}



});



// ===============================
// COMANDOS STAFF
// ===============================


client.on("messageCreate", async(message)=>{


if(message.author.bot) return;


if(!message.content.startsWith(prefix))
return;



if(
!message.member.roles.cache.has(
process.env.CARGO_ADMIN
)

) return;



const args = message.content.slice(1).split(" ");

const cmd=args.shift();



if(cmd==="lock"){


message.channel.permissionOverwrites.edit(

message.guild.id,

{
SendMessages:false
}

);


message.reply("🔒 Canal bloqueado.");

}



if(cmd==="unlock"){


message.channel.permissionOverwrites.edit(

message.guild.id,

{
SendMessages:true
}

);


message.reply("🔓 Canal liberado.");

}


});



client.login(
process.env.TOKEN
);