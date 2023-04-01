const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const mysql = require('mysql2/promise');
const { mysqlConfig } = require('./config.json');


const test = {

};


class Registration {
    static createBtns(idsArr, labelsArr, emojisArr, stylesArr, rows) {
        let btns = [];
        for (let i = 0; i < (idsArr.length > 5 ? 5 : idsArr.length); i++) { // max 5 btns in a raw
            btns.push(new ButtonBuilder()
                .setCustomId(idsArr[i])
                .setEmoji(emojisArr[i])
                .setStyle(stylesArr[i]));

            if (labelsArr[i].length > 0) btns[i].setLabel(labelsArr[i]);
        }
    
        idsArr.splice(0, 5);
        labelsArr.splice(0, 5);
        emojisArr.splice(0, 5);
        stylesArr.splice(0, 5);
        rows.push(new ActionRowBuilder().addComponents(...btns));
    
        if (idsArr.length > 0) return this.createBtns(idsArr, labelsArr, emojisArr, stylesArr, rows);
        else return rows;
    }

    static createOkNoBtns(okId, noId) {
        return this.createBtns([okId, noId], ['', ''], ['✔️', '✖️'], [ButtonStyle.Success, ButtonStyle.Danger], []);
    }

    static async disableBtns(msg) {
        let btns = [], rows = [];
    
        msg.components.forEach(btnsRow => {
            btnsRow.components.forEach(btn => {
                btn = ButtonBuilder.from(btn);
                btn.setDisabled(true);
                btns.push(btn);
            });
            rows.push(new ActionRowBuilder().addComponents(...btns));
            btns = [];
        });
    
        if (msg.content && !msg.embeds) await msg.edit({ content: msg.content, components: rows });
        else if (!msg.content && msg.embeds) await msg.edit({ embeds: msg.embeds, components: rows });
        else if (msg.content && msg.embeds) await msg.edit({ content: msg.content, embeds: msg.embeds, components: rows });
    }


    constructor(member) {
        this.id = member.id;
        this.channel = null;
        this.phase = 0;
    }

    async create(member) {
        let permissions = [
            {
                id: member.id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
            },
            {
                id: '911932147948990535', // bot's permissions
                allow: ['VIEW_CHANNEL'],
            },
            {
                id: member.guild.roles.everyone,
                deny: ['VIEW_CHANNEL'],
            },
        ];

        let parent = await member.guild.channels.fetch('416584939413438475'); // категория "информация"
        this.channel = await member.guild.channels.create(`❗${member.user.username} registration`, { type: 'GUILD_TEXT', parent: parent, permissionOverwrites: permissions });

        await member.roles.add('411968125869752340'); // ambassador
    }
}


class EventCreation {
    constructor() {
        this.creatorId = ''; // msg.author.id;
        this.phase = 0;
        this.eventName = '';
        this.rewardName = '';
        this.voiceChannels = '';
    }

    async begin() {
        await msg.channel.send('Процесс создания ивента запущен!');
        await msg.channel.send('Название ивента:');
    }
}


async function createRegistration(member, registrationUsers) {
    let permissions = [
        {
            id: member.id,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
        },
        {
            id: '911932147948990535', // права для бота
            allow: ['VIEW_CHANNEL'],
        },
        {
            id: member.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
        },
    ];

    // let parent = await robot.channels.fetch('416584939413438475');
    let parent = await member.guild.channels.fetch('416584939413438475');
    
    // const connection = await mysql.createConnection(mysqlConfig);
    // let response = await connection.execute(`SELECT * FROM event_settings`); // !!
    // let inviteCode = response[0][0].inviteCode;
    // await connection.end();
    // let infoChannel = await robot.channels.fetch('786499159679041536');
    
    // let channelInvites = await infoChannel.fetchInvites();
    // const ei = invites;
    // invites = channelInvites;
    // const invite = channelInvites.find(i => ei.get(i.code).uses < i.uses);
    // if (invite && invite.code === inviteCode) {



    await member.roles.add('411968125869752340');
    let regChannel = await member.guild.channels.create(`❗${member.user.username} registration`, { type: 'GUILD_TEXT', parent: parent, permissionOverwrites: permissions });
    await regChannel.send(`<@${member.id}>\nHi! To participate in the event, you need to register. It's quite simple! If you are a member of a clan, specify it's name, otherwise insert a "-"`);
    
    registrationUsers.push({
        userId: member.user.id,
        channel: regChannel.id, // channel => channelId
        phase: 0
    });



    // }
}


async function f2(reaction, user, registrationUsers) {
    let idField = reaction.message.embeds[0].fields.find(item => item.name === ':id: id:');
    let thisUserIndex = registrationUsers.findIndex(item => item.userId === idField.value);
    const sendPM = require('./sendPM.js');


    //if (!~thisUserIndex) return;
    if (thisUserIndex === -1) return;


    if (reaction.emoji.name === '✅') {
        let forDelete = await reaction.message.guild.channels.fetch(registrationUsers[thisUserIndex].channel);
        await forDelete.delete();
        let thisRegUser = await reaction.message.guild.members.fetch(registrationUsers[thisUserIndex].userId); // !! thisRegUser на thisRegMember
        await thisRegUser.roles.add('786495891926024192');
        await reaction.message.channel.send(`Заявка была одобрена пользователем ${user.username}\nСсылка на пост: https://discord.com/channels/394055433641263105/819486790531809310/${reaction.message.id}`);
        await reaction.message.reactions.cache.find(item => item.emoji.name === '❌').remove();
        
        
        let msg = `You have successfully registered for the event! All the necessary information is available in this channel:
        \nhttps://discord.com/channels/394055433641263105/786499159679041536\n
        Good luck and have fun! 🙃`;
        await sendPM(msg, thisRegUser.user, reaction.message.guild, 'об одобрении заявки на регистрацию');
        
        // try {
        //     await thisRegUser.send('You have successfully registered for the event! All the necessary information is available in this channel:\nhttps://discord.com/channels/394055433641263105/786499159679041536 \nGood luck and have fun! 🙃');
        // } catch (err) {
        //     console.log(err);
        //     let textChannel = await robot.channels.fetch('767326891291049994');
        //     await textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение пользователю <@${thisRegUser.id}>, ${thisRegUser.tag}`);
        // }




        registrationUsers.splice(thisUserIndex, 1);
    }
    else if (reaction.emoji.name === '❌') {
        let forDelete = await reaction.message.guild.channels.fetch(registrationUsers[thisUserIndex].channel);
        await forDelete.delete();
        let thisRegUser = await thisGuild.members.fetch(registrationUsers[thisUserIndex].userId); // !! thisRegUser на thisRegMember
        await reaction.message.channel.send(`Заявка была отклонена пользователем ${user.username}\nСсылка на пост: https://discord.com/channels/394055433641263105/819486790531809310/${reaction.message.id}`);
        await reaction.message.reactions.cache.find(item => item.emoji.name === '✅').remove();
        
        
        
        let msg = `Unfortunately, your application for participation has been declined`;
        await sendPM(msg, thisRegUser.user, reaction.message.guild, 'об отказе заявки на регистрацию');
        
        // try {
        //     await thisRegUser.send('Unfortunately, your application for participation has been declined');
        // } catch (err) {
        //     console.log(err);
        //     let textChannel = await robot.channels.fetch('767326891291049994');
        //     textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение пользователю <@${thisRegUser.id}>, ${thisRegUser.tag}`);
        // }



        registrationUsers.splice(thisUserIndex, 1);
    }
}

async function onConfirmSettings(interaction, eventSettings) {
    // let textChannel = await interaction.guild.channels.fetch('411948808457682954');
    // let regChannel = await interaction.guild.channels.fetch('819486790531809310');
    // let infoChannel = await interaction.guild.channels.fetch('786499159679041536');
    // let eventCategory = await interaction.guild.channels.fetch('786495165731831818');

    // await regChannel.send(`**Открыта регистрация на ивент "${eventSettings.eventName}"**`);
    // await eventCategory.setName(eventSettings.eventName);
    // await interaction.guild.roles.create({
    //     name: `♠️ ${eventSettings.rewardName} ♠️`,
    //     color: 'AQUA',
    //     position: 4 // !! уточнить позицию
    // });

    // let inviteURL = await infoChannel.createInvite({
    //     maxAge: 0
    // });
    let inviteURL = { code: 'test' };

    // await textChannel.send(inviteURL.toString());

    await interaction.reply(`Ивент **${eventSettings.eventName}** успешно создан! Специальная ссылка-приглашение: ${inviteURL.code}`);

    const connection = await mysql.createConnection(mysqlConfig);
    await connection.execute(`INSERT INTO event_settings (eventName, rewardName, inviteCode, voiceChannels) VALUES ('${eventSettings.eventName}', '${eventSettings.rewardName}', '${inviteURL.code}', '${eventSettings.voiceChannels}')`);
    await connection.end();  

    eventSettings = { isEventNow: true };
    await Registration.disableBtns(interaction.message);
}

async function onDenySettings(interaction, eventSettings) {
    eventSettings = {};
    await interaction.reply('Создание ивента было отменено.');
    await Registration.disableBtns(interaction.message);
}

async function startEditing(interaction, eventSettings) {
    await Registration.disableBtns(interaction.message);
    editingId = +interaction.customId.match(/\d/)[0];
    eventSettings.phase += editingId;
    await interaction.reply(`Укажите новое значение для [${editingId}]`);
}

async function f3(reaction, eventSettings, mysql, mysqlConfig) {
    if (reaction.emoji.name === '✅') { 
        let textChannel = await reaction.message.guild.channels.fetch('411948808457682954');
        let regChannel = await reaction.message.guild.channels.fetch('819486790531809310');
        let infoChannel = await reaction.message.guild.channels.fetch('786499159679041536'); 
        let eventCategory = await reaction.message.guild.channels.fetch('786495165731831818');

        await regChannel.send(`**Открыта регистрация на ивент "${eventSettings.eventName}"**`);
        await eventCategory.setName(eventSettings.eventName);
        await reaction.message.guild.roles.create({
            name: `♠️ ${eventSettings.rewardName} ♠️`,
            color: 'AQUA',
            position: 4
        });
    
        let inviteURL = await infoChannel.createInvite({
            maxAge: 0
        });
        await textChannel.send(inviteURL.toString());

        const connection = await mysql.createConnection(mysqlConfig);
        await connection.execute(`INSERT INTO event_settings (eventName, rewardName, inviteCode, voiceChannels) VALUES ('${eventSettings.eventName}', '${eventSettings.rewardName}', '${inviteURL.code}', '${eventSettings.voiceChannels}')`);
        await connection.end(); 
    
        // eventSettings = { // !! корректно ли так делать с точки зрения паттернов
        //     isEventNow: true,
        // };   

        eventSettings.isEventNow = true;
    }
    else if (reaction.emoji.name === '1️⃣') { 
        await reaction.message.channel.send('Новое название ивента:');
        eventSettings.phase = 4;
    }
    else if (reaction.emoji.name === '2️⃣') { 
        await reaction.message.channel.send('Новое название награды:');
        eventSettings.phase = 5;
    }
    else if (reaction.emoji.name === '3️⃣') { 
        await reaction.message.channel.send('Новый список голосовых каналов:');
        eventSettings.phase = 6;
    }
    else if (reaction.emoji.name === '❌') { 
        eventSettings = {};
        await reaction.message.channel.send('Создание ивента было отменено.');
    }
}




async function f4(message, mysql, mysqlConfig, eventSettings) {
    eventSettings.isEventNow = false;

    let role = await message.guild.roles.fetch('786495891926024192'); // event warrior
    const connection = await mysql.createConnection(mysqlConfig);

    let response2 = await connection.execute(`SELECT * FROM event_settings`);

    await message.channel.send(`Ивент "${response2[0][0].eventName}" был завершен`)

    const sendPM = require('./sendPM.js');

    role.members.forEach(async member => {




        let msg = `Hi! On behalf of the Hawkband clan, thank you for participating in the event "${response2[0][0].eventName}"!`;
        await sendPM(msg, member.user, message.guild, 'о благодарности за участие в ивенте');

        // try {
        //     await member.send(`Hi! On behalf of the Hawkband clan, thank you for participating in the event "${response2[0][0].eventName}"!`);
        // } catch (err) {
        //     console.log(err);
        //     let textChannel = await robot.channels.fetch('411948808457682954');
        //     textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение пользователю <@${message.author.id}>, ${message.author.tag}`);
        // }



        await member.roles.remove('786495891926024192');
    });

    let response = await connection.execute(`SELECT * FROM participants`);
    let rewardRole = message.guild.roles.cache.find(role => role.name === `♠️ ${response2[0][0].rewardName} ♠️`)
    response[0].forEach(async (item) => {
        if (item.time > 1799) {
            await message.guild.members.cache.find(member => member.id === item.id).roles.add(rewardRole);
        }
    });
    let infoChannel = await message.guild.channels.fetch('786499159679041536'); 
    let invs = await infoChannel.fetchInvites();

    invs.forEach(async invite => {
        if (invite.code === response2[0][0].inviteCode) {
            await invite.delete();
            return;
        }
    });

    await connection.execute(`TRUNCATE TABLE event_settings`);
    await connection.execute(`TRUNCATE TABLE participants`);

    await connection.end();
}






async function showSettings(message, eventSettings) {
    const eventSettingsForm = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle(':gear: Настройки ивента :gear:')
            .setFooter({ text: 'Hawkband Clan' })
            .setTimestamp()
            .setThumbnail(message.guild.iconURL())
            .addFields(
                {name: ' :scroll: Название ивента [1]: ', value: eventSettings.eventName, inline: true},
                {name: ' :military_medal: Название награды [2]:', value: eventSettings.rewardName, inline: true},
                {name: ' :loud_sound: Список голосовых каналов [3]:', value: eventSettings.voiceChannels, inline: false}
            );

    const btns = Registration.createBtns(['1', '2', '3'], ['', '', ''], ['1️⃣', '2️⃣', '3️⃣'], [ButtonStyle.Secondary, ButtonStyle.Secondary, ButtonStyle.Secondary], []);
    const btns2 = Registration.createOkNoBtns('confirm', 'deny');
    btns.push(...btns2);

    await message.channel.send({ embeds: [eventSettingsForm], components: btns });
}

    



async function f6(msg, eventSettings) {
    eventSettings.creator = msg.author.id;
    eventSettings.phase = 0;
    
    await msg.channel.send('Процесс создания ивента запущен!');
    await msg.channel.send('Название ивента:');
    
}



async function f7(msg, registrationUsers) {
    let thisRegUser = registrationUsers.find(item => item.userId === msg.author.id);

    if (thisRegUser && msg.channelId === thisRegUser.channel && thisRegUser.phase === 0) {
        await msg.channel.send('Thanks for the reply! Your application for registration has been sent to the organizers. I\'ll let you know about their decision');
        thisRegUser.phase = 1;

        const registrationForm = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle(':envelope_with_arrow: Новая заявка на регистрацию :crossed_swords:')
            .setFooter('Hawkband Clan')
            .addFields(
                {name: ' :classical_building: Название клана:', value: msg.content},
                {name: ' :video_game: Discord:', value: `${msg.author.tag} <@${msg.author.id}>`},
                {name: ' :id: id:', value: `${msg.author.id}`})
            .setThumbnail(msg.author.avatarURL()).setTimestamp();
        let regAdmChannel = await msg.guild.channels.fetch('819486790531809310');
        let embMsg = await regAdmChannel.send({ embeds: [registrationForm] });
        await embMsg.react('✅');
        await embMsg.react('❌');
    }
}

async function f5(message, eventSettings) {
    if (eventSettings.phase === 0) { // !! мб !eventSettings.eventName
        eventSettings.eventName = message.content;
        eventSettings.phase = 1;
        await message.channel.send('Название награды:');
    }
    else if (eventSettings.phase === 1) {
        eventSettings.rewardName = message.content;
        await message.channel.send('Список голосовых каналов:');
        eventSettings.phase = 2
    }
    else if (eventSettings.phase > 1) {
        let editParam = '';
        if (eventSettings.phase === 4) editParam = 'eventName';
        else if (eventSettings.phase === 5) editParam = 'rewardName';
        else if (eventSettings.phase === 2 || eventSettings.phase === 6) editParam = 'voiceChannels';
        eventSettings[editParam] = message.content;
        eventSettings.phase = 3;
        await showSettings(message, eventSettings);
    }
}


async function f8(reaction, user, registrationUsers) {
    let thisGuild = reaction.message.guild;
    let member = thisGuild.members.cache.get(user.id);
    let memberRoles = member.roles.cache;

    if ( memberRoles.find(role => role.id === '786495891926024192') ) return;

    if ( memberRoles.find(memberRole => memberRole.id === '411968125869752340') ) {

        await createRegistration(member, registrationUsers)

        // let parent = await robot.channels.fetch('416584939413438475');
        // let regChannel = await thisGuild.channels.create(`❗${user.username} registration `, { type: 'GUILD_TEXT', parent: parent, permissionOverwrites: [
        //     {
        //         id: member.id,
        //         allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
        //     },
        //     {
        //         id: '911932147948990535', // права для бота
        //         allow: ['VIEW_CHANNEL'],
        //     },
        //     {
        //         id: member.guild.roles.everyone,
        //         deny: ['VIEW_CHANNEL'],
        //     },
        // ]});

        // registrationUsers.push({
        //     userId: user.id,
        //     channel: regChannel.id,
        //     phase: 0
        // });
        // await regChannel.send(`<@${user.id}>\nHi! To participate in the event, you need to register. It's quite simple! If you are a member of a clan, specify it's name, otherwise insert a "-"`);
    }
    else {
        let rolesArray = [
            '685131993549373448',
            '685131993955958838',
            '685131994069598227',
            '687287277956890661',
        ];
        rolesArray.forEach(async (role) => {
            if ( memberRoles.find(memberRole => memberRole.id === role) ) {
                const registrationForm = new EmbedBuilder()
                    .setColor('#e74c3c')
                    .setTitle(':envelope_with_arrow: Ястреб выступает вместе с нами :crossed_swords:')
                    .setDescription(`Ястреб <@${user.id}> заявил о своем желании сражаться на ивенте. Ему автоматически была выдана роль <@&786495891926024192>`)
                    .setFooter('Hawkband Clan')
                    .setThumbnail(user.avatarURL()).setTimestamp();
                let regAdmChannel = await thisGuild.channels.fetch('819486790531809310');
                await regAdmChannel.send({ embeds: [registrationForm] });
                await thisGuild.members.cache.get(user.id).roles.add('786495891926024192');
            }
        });
    }

}


module.exports = {
    createRegistration: createRegistration,
    onConfirmSettings: onConfirmSettings,
    onDenySettings: onDenySettings,
    startEditing: startEditing,
    f2: f2,
    f3: f3,
    f4: f4,
    f5: f5,
    f6: f6,
    f7: f7,
    f8: f8,
};