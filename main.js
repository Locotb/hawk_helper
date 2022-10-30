const { Client, VoiceChannel, Intents } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const robot = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES, 
        Intents.FLAGS.DIRECT_MESSAGES, 
        Intents.FLAGS.GUILD_MEMBERS, 
        Intents.FLAGS.GUILD_PRESENCES, 
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS, 
        Intents.FLAGS.GUILD_VOICE_STATES,
    ],
    partials: [
        'MESSAGE', 
        'CHANNEL', 
        'REACTION',
    ],
});
const comms = require("./comms.js"); // Подключаем файл с командами для бота
const mysql = require('mysql2/promise');

const config = require('./config.json');

// const config = require('./config.json'); // Подключаем файл с параметрами и информацией
// const mysqlConfig = config.mysql;
// const token = config.token; // «Вытаскиваем» из него токен
// const prefix = config.prefix; // «Вытаскиваем» из него префикс

const fs = require('fs'); // Подключаем родной модуль файловой системы node.js  
const { createReadStream } = require('fs');
const manageGameRoles = require('./gameRoles.js');
// const verification = require('./verification.js');
const verificationClasses = { Verification, Recruit_Verification, Ally_Verification, Ambassador_Verification } = require('./verificationNew.js');
const gameEvents = require('./gameEvents.js');
const { ListenedMember } = require('./channelsListening.js');
const commands = require('./commands.js');

const { join } = require('path');

let channelUsers = [];
let listenedChannelsIds = [];
let verificationUsers = [];
let registrationUsers = [];
let eventSettings = {
    isEventNow: false,
};
let invites;

const { createAudioPlayer, createAudioResource, StreamType, entersState, VoiceConnectionStatus, joinVoiceChannel } = require('@discordjs/voice');
const player = createAudioPlayer();

// Старое ↓
// const Discord = require('discord.js'); // Подключаем библиотеку discord.js
// const robot = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] }); // Объявляем, что robot - бот


// const { send, report } = require('process'); // ???
// const { text, response } = require('express'); // ???


robot.once('ready', async () => {
    console.log(`${robot.user.username} запустился!`);
    console.log('===================================================================================================\n');   

    // const resource = createAudioResource('./mus.mp3');
    // const resource = createAudioResource('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', {
    //     inputType: StreamType.Arbitrary,
    // });
    // player.play(resource)

    robot.user.setActivity('!help', { type: 'WATCHING' });

    const connection = await mysql.createConnection(config.mysqlConfig);
    let response = await connection.execute(`SELECT * FROM event_settings`);
    if (response[0][0] && response[0][0].eventName) eventSettings.isEventNow = true;


    response = await connection.execute(`SELECT * FROM listened_channels`);
    response[0].forEach(channel => listenedChannelsIds.push(channel.channelId));
    await connection.end(); 

    let infoChannel = await robot.channels.fetch('786499159679041536');
    infoChannel.fetchInvites().then(channelInvites => {
        invites = channelInvites;
    });

    let tGuild = await robot.guilds.fetch(config.guildId);

    robot.specChannels = {
        logs: null,
        verification: null,
        registration: null,
        recruitWelcome: null,
        information: null,
        chronicle: null,
        test: null,
    };

    for (let chnl in config.specChannels) robot.specChannels[chnl] = await tGuild.channels.fetch(config.specChannels[chnl]);
});

robot.on('interactionCreate', async interaction => {
	if ( interaction.isCommand() ) {
        const { commandName } = interaction;

        if (commandName === 'data') await commands.data(interaction);
        else if (commandName === 'notice') await commands.notice(interaction);
        else if (commandName === 'createlistenedchannel') await commands.createListenedChannel(interaction, listenedChannelsIds);
    }
    else if (interaction.isButton() && verificationUsers[0]) {
        //let thisVerUser = verificationUsers.find(verUser => verUser.userId === interaction.member.id); work version
        let thisVerMember = verificationUsers.find(verMember => (verMember.id === interaction.member.id) && (verMember.channel.id === interaction.channelId));

        // !! тестовый в проверке ниже
        if (!thisVerMember && interaction.channelId !== '767326891291049994') { // !! логика работает правильно до тех пор, пока кнопки есть только в верификации
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply(`Эта кнопка предназначается для другого пользователя!`);
            return;
        }

        await interaction.deferReply();

        if (interaction.customId === 'ru' || interaction.customId === 'eng' || interaction.customId === 'reject_verification_info') await thisVerMember.startRoleChoice(interaction);
        
        else if (interaction.customId === 'recruit' || interaction.customId === 'ally' || interaction.customId === 'ambassador') {
            let classPrefix = interaction.customId.charAt(0).toUpperCase() + interaction.customId.slice(1),
                index = verificationUsers.indexOf(thisVerMember);

            verificationUsers[index].role = interaction.customId;
            verificationUsers[index] = new verificationClasses[`${classPrefix}_Verification`](thisVerMember, interaction.customId);
            await verificationUsers[index].startNextPhase(interaction);
        }
        else if (interaction.customId === 'cancel') await thisVerMember.startPrevPhase(interaction);
        else if (interaction.customId === 'confirm_verification_info') await thisVerMember.sendFormToAdmins(interaction);
        else if (interaction.customId === 'ok_recruit' || interaction.customId === 'ok_ally') { // !! change customId
            let idField = interaction.message.embeds[0].fields.find(item => item.name === ':id: id:');
            let tMemberIndex = verificationUsers.findIndex(verUser => verUser.id === idField.value);
            await verificationUsers[tMemberIndex].onConfirmForm(interaction);
        }
        else if (interaction.customId === 'ok_ambassador') thisVerMember.onConfirmForm(interaction);        
        else if (interaction.customId === 'no_recruit' || interaction.customId === 'no_ally') { // !! change customId
            let idField = interaction.message.embeds[0].fields.find(item => item.name === ':id: id:');
            let tMemberIndex = verificationUsers.findIndex(verUser => verUser.id === idField.value);
            await verificationUsers[tMemberIndex].onRejectForm(interaction);
        }
        else if (interaction.customId.match(/param/)) await thisVerMember.startEditing(interaction);
    }

});


robot.on('channelDelete', async channel => {
    let listenedChannelIndex = listenedChannelsIds.findIndex(id => id === channel.id);

    if (~listenedChannelIndex) {
        listenedChannelsIds.splice(listenedChannelIndex, 1);
        const connection = await mysql.createConnection(config.mysqlConfig);
        await connection.execute(`DELETE FROM listened_channels WHERE channelId=${channel.id}`); // авто инкремент не поправляется
        await connection.end();
        return;
    }

    if (verificationUsers[0]) {
        let verificationUserIndex = verificationUsers.findIndex(user => user.channel.id === channel.id);
        if (~verificationUserIndex) {
            verificationUsers.splice(verificationUserIndex, 1);
            return;
        }
    }

    if (registrationUsers[0]) {
        let registrationUserIndex = registrationUsers.findIndex(user => user.channel === channel.id);
        if (~registrationUserIndex) {
            registrationUsers.splice(registrationUserIndex, 1);
            return;
        }
    }
});


robot.on('guildMemberRemove', async member => {
    if (verificationUsers[0]) {
        let verUserIndex = verificationUsers.findIndex(user => user.userId === member.id);
        if (~verUserIndex) {
            if (verificationUsers[verUserIndex].phase.name === 'confirmInfo') verificationUsers[verUserIndex].onLeaveGuild();
            return;
        }
    }
    // !! добавить логику для случая, когда достигнута последняя фаза регистрации
    if (registrationUsers[0]) {
        let registrationUserIndex = registrationUsers.findIndex(user => user.userId === member.id);
        if (~registrationUserIndex) {
            if (registrationUsers[registrationUserIndex].phase === 1) {
                let regChannel = await member.guild.channels.fetch('819486790531809310');
                await regChannel.send(`text`);
            }
            registrationUsers.splice(registrationUserIndex, 1);
            return;
        }
    }
});

// robot.on('error', err => {}); // !!


robot.on('voiceStateUpdate', async (oldState, newState) => {    
    let newRecVC = listenedChannelsIds.find(id => id === newState.channelId),
        oldRecVC = listenedChannelsIds.find(id => id === oldState.channelId);

    let oldEventVC, newEventVC;

    if (eventSettings.isEventNow && newState.member.roles.cache.find(role => role.id === '786495891926024192') ) {
        const connection = await mysql.createConnection(config.mysqlConfig);
        let response = await connection.execute('SELECT voiceChannels FROM event_settings');
        let eventChannels = response[0][0].voiceChannels.split(', ');
        oldEventVC = eventChannels.find(channel => channel === oldState.channelId);
        newEventVC = eventChannels.find(channel => channel === newState.channelId);
        await connection.end();
    }
    
    if ( (newRecVC && !oldRecVC) || (newEventVC && !oldEventVC) ) {
        let role = ListenedMember.getRole(newState.member.roles);
        if (!role) return;
        let listenedMember = new ListenedMember(newState, role);
        channelUsers.push(listenedMember);
        await listenedMember.onConnect(newState);
    }
    else if ( (!newRecVC && oldRecVC) || (!newEventVC && oldEventVC) ) {
        // let event = false;
        // if (!newEventVC && oldEventVC) event = true;
        let tMemberIndex = channelUsers.findIndex(listenedMember => listenedMember.id === newState.id);
        if (~tMemberIndex) {
            channelUsers[tMemberIndex].onDisconnect(newState);
            channelUsers.splice(tMemberIndex, 1);
        }
    }
});



// robot.on('inviteCreate', async invite => {
//     let infoChannel = await robot.channels.fetch('786499159679041536');
//     infoChannel.fetchInvites().then(channelInvites => {
//         invites = channelInvites;
//     });
// });

// robot.on('inviteDelete', async invite => {
//     let infoChannel = await robot.channels.fetch('786499159679041536');
//     infoChannel.fetchInvites().then(channelInvites => {
//         invites = channelInvites;
//     });
// });

robot.on('guildMemberAdd', async (member) => { 
    // if (!isEventNow) ver(member); // мб наоборот if (isEventNow)... else верификация
    if (!eventSettings.isEventNow) {
        //await verification.createVerification(member, verificationUsers); // work version

        let newVerMember = new verificationClasses.Verification(member);
        verificationUsers.push(newVerMember);
        newVerMember.create(member);
    }
    else {
        const connection = await mysql.createConnection(config.mysqlConfig);
        let response = await connection.execute(`SELECT * FROM event_settings`); // !!
        let inviteCode = response[0][0].inviteCode;
        await connection.end();
        let infoChannel = await robot.channels.fetch('786499159679041536');
        
        let channelInvites = await infoChannel.fetchInvites();
        const ei = invites;
        invites = channelInvites;
        const invite = channelInvites.find(i => ei.get(i.code).uses < i.uses);

        if (invite && invite.code === inviteCode) await gameEvents.createRegistration(member, registrationUsers);
        else await verification.createVerification(member, verificationUsers);
    }
});

//     let permissions = [
//         {
//             id: member.id,
//             allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
//         },
//         {
//             id: '763434829517422652',
//             allow: ['VIEW_CHANNEL'],
//         },
//         {
//             id: '687287277956890661', // пенсия
//             deny: ['VIEW_CHANNEL'],
//         }, 
//         {
//             id: '697102081827274794', // союзники
//             deny: ['VIEW_CHANNEL'],
//         },
//         {
//             id: '411968125869752340', // послы
//             deny: ['VIEW_CHANNEL'],
//         },
//         {
//             id: '769889100781322250', // ковали
//             deny: ['VIEW_CHANNEL'],
//         },
//         {
//             id: '685131994069598227', // круг воинов
//             deny: ['VIEW_CHANNEL'],
//         },
//         {
//             id: '685131993955958838', // круг командиров
//             deny: ['VIEW_CHANNEL'],
//         },
//     ];
//     let parent = await robot.channels.fetch('416584939413438475');

//     if (isEventNow) {
        // const connection = await mysql.createConnection(mysqlConfig);
        // let response = await connection.execute(`SELECT * FROM event_settings`);
        // let inviteCode = response[0][0].inviteCode;
        // await connection.end();
        // let infoChannel = await robot.channels.fetch('786499159679041536');

        // let channelInvites = await infoChannel.fetchInvites();
        // const ei = invites;
        // invites = channelInvites;
        // const invite = channelInvites.find(i => ei.get(i.code).uses < i.uses);
        // if (invite && invite.code === inviteCode) {
        //     // await ↓
        //     member.roles.add('411968125869752340');
        //     let regChannel = await member.guild.channels.create(`❗${member.user.username} registration`, {type: 'text', parent: parent, permissionOverwrites: permissions});
        //     registrationUsers.push({
        //         userId: member.user.id,
        //         channel: regChannel.id,
        //         phase: 0
        //     });
        //     regChannel.send(`<@${member.id}>\nHi! To participate in the event, you need to register. It's quite simple! If you are a member of a clan, specify it's name, otherwise insert a "-"`);
        //     return;
        // }
//     }

//     await member.roles.add('685130173670096907');
//     let thisGuild = await robot.guilds.fetch('394055433641263105');
//     let fortext = await thisGuild.channels.create(`❗${member.user.username} верификация `, {type: 'text', parent: parent, permissionOverwrites: permissions});

//     let msg = await fortext.send(`<@${member.id}>\nПриветствую тебя, путник. Меня зовут Добрыня, я помогу тебе освоиться здесь. Для начала мне нужно собрать о тебе некоторую информацию и донести ее до самых почетных и уважаемых членов нашего братства. Идет?\n\`\`\`1) Нажми на галочку, если хочешь начать процесс верификации\n2) Нажми на крестик, если ты не хочешь начинать процесс верификации или если хочешь его отменить\`\`\``);
//     msg.react('✅');
//     msg.react('❌');

//     verificationUsers.push({
//         userId: member.user.id,
//         phase: 0,
//         channel: fortext.id,
//     });
// });

// robot.on('voiceStateUpdate', async (oldState, newState) => {

//     let textChannel = await robot.channels.fetch('767326891291049994'); // текстовый с логами (заменен на тестовый)

//     let userName = newState.member.user.username;

//     let userRole; 
//     let rolesArray = [
//         '411942349753548800', 
//         '681420100565467157', 
//         '681410021463949322', 
//         '769887786806411274',
//         '684046420000374950', 
//         '684046428783378435', 
//         '684046480247488514',
//         '685130078098948099',
//         '685130164061208787', 
//         '685130169195036700',
//         '685130171040268414',
//         '685130172047163490', 
//         '685130173154066480', 
//         '687287277956890661',
//     ];
    
//     for (let i = 0; i < rolesArray.length; i++) {
//         let role = newState.member.roles.cache.find(item => item.id == rolesArray[i]);
//         if (role) {
//             userRole = role.name;
//             break;
//         }
//     }

//     if (userRole === undefined) return;

//     let recordingChannels = [
//         '480807623525007361', // берсерки
//         '544059704570150912', // беркуты
//         '398099895569088513', // ветераны
//         '911673341641916486', // капитаны
//         '911673379352870923', // предки
//     ];

//     let newRecVC = recordingChannels.find(elem => elem === newState.channelID);
//     let oldRecVC = recordingChannels.find(elem => elem === oldState.channelID);
//     let oldEventVC, newEventVC;

//     if (isEventNow && newState.member.roles.cache.find(item => item.id === '786495891926024192') ) {
//         const connection = await mysql.createConnection(mysqlConfig);
//         let response = await connection.execute('SELECT * FROM event_settings'); // SELECT voiceChannels FROM event_settings
//         let eventChannels = response[0][0].voiceChannels.split(', ');
//         oldEventVC = eventChannels.find(channel => channel === oldState.channelID);
//         newEventVC = eventChannels.find(channel => channel === newState.channelID);
//         await connection.end();
//     }

//     let timeInChannel;

//     if ( (newRecVC && !oldRecVC) || (newEventVC && !oldEventVC) ) {

//         channelUsers.push({
//             id: newState.id,
//             connectionTime: Date.now(),
//         });

//         textChannel.send(`[${new Date().toLocaleString('ru')}] ${userName} подключился`);

//     } else if ( (oldRecVC && !newRecVC) || (oldEventVC && !newEventVC) ) {
        
//         let nameAndTag = newState.member.user.tag;
//         let regexp = /\d+/y;
//         regexp.lastIndex = nameAndTag.indexOf('#') + 1;
//         let userTag = regexp.exec(nameAndTag)[0];

//         textChannel.send(`[${new Date().toLocaleString('ru')}] ${userName} отключился`);

//         let month = new Date().getMonth();

//         let currentUser = channelUsers.find(item => item.id === newState.id);

//         currentUser.disconnectionTime = Date.now();
//         timeInChannel = Math.trunc( (currentUser.disconnectionTime - currentUser.connectionTime)/1000 );

//         textChannel.send(`Время, которое ${userName} провел в голосовом канале: ${timeInChannel}`);

//         const connection = await mysql.createConnection(mysqlConfig);

//         if (oldEventVC && !newEventVC) {
//             let response = await connection.execute(`SELECT * FROM participants`);
//             if ( !response[0].find(item => item.id === newState.id) ) {
//                 connection.execute(`INSERT INTO participants (id, name, time) VALUES ('${newState.id}', '${newState.member.user.username}', 0)`);
//                 response = await connection.execute(`SELECT * FROM participants`);
//             }
//             let tableTime = response[0].find(item => item.id === newState.id).time;
//             let resultTime = tableTime + timeInChannel;
//             connection.execute(`UPDATE participants SET name='${newState.member.user.username}', time=${resultTime} WHERE id=${currentUser.id}`);
//         }

//         let response = await connection.execute(`SELECT * FROM time_online`);

//         let tableTime = 0;

//         if ( !response[0].find(item => item.id == newState.id) ) {
//             try {
//                 if (month == 0) await connection.execute(`INSERT INTO time_online (id, name, tag, role, totalTime, time${month}, time${month + 11}) VALUES (${newState.id.toString()}, '${userName}', '${userTag}', '${userRole}', 0, 0, 0)`);
//                 else await connection.execute(`INSERT INTO time_online (id, name, tag, role, totalTime, time${month}, time${month - 1}) VALUES (${newState.id.toString()}, '${userName}', '${userTag}', '${userRole}', 0, 0, 0)`);
//                 response = await connection.execute(`SELECT * FROM time_online`);
//             }
//             catch (err) {
//                 if (month == 0 || month == 1) await connection.execute(`ALTER TABLE time_online DROP COLUMN time${month + 10}, ADD COLUMN time${month} BIGINT(255) DEFAULT 0`);
//                 else await connection.execute(`ALTER TABLE time_online DROP COLUMN time${month - 2}, ADD COLUMN time${month} BIGINT(255) DEFAULT 0`);
//                 if (month == 0) await connection.execute(`INSERT INTO time_online (id, name, tag, role, totalTime, time${month}, time${month + 11}) VALUES (${newState.id.toString()}, '${userName}', '${userTag}', '${userRole}', 0, 0, 0)`);
//                 else await connection.execute(`INSERT INTO time_online (id, name, tag, role, totalTime, time${month}, time${month - 1}) VALUES (${newState.id.toString()}, '${userName}', '${userTag}', '${userRole}', 0, 0, 0)`);
//                 response = await connection.execute(`SELECT * FROM time_online`);
//             }
//         }

//         tableTime = response[0].find(item => item.id == newState.id)[`time${month}`]; 
//         if (tableTime === undefined) {
//             if (month == 0 || month == 1) await connection.execute(`ALTER TABLE time_online DROP COLUMN time${month + 10}, ADD COLUMN time${month} BIGINT(255) DEFAULT 0`);
//             else await connection.execute(`ALTER TABLE time_online DROP COLUMN time${month - 2}, ADD COLUMN time${month} BIGINT(255) DEFAULT 0`);
//             tableTime = 0;
//         }
//         let tableTotalTime = response[0].find(item => item.id == newState.id).totalTime; 
//         let resultTime = timeInChannel + tableTime;
//         let resultTotalTime = timeInChannel + tableTotalTime;
//             // -await ↓
//         await connection.execute(`UPDATE time_online SET name='${userName}', tag='${userTag}', role='${userRole}', totalTime=${resultTotalTime}, time${month}=${resultTime} WHERE id=${currentUser.id.toString()}`);
        
//         let currentUserIndex = channelUsers.findIndex(item => item.id === newState.id);
//         channelUsers.splice(currentUserIndex, 1);

//         connection.end(); 
//     }
       
// });

robot.on('messageCreate', async message => {

    if (message.webhookID && message.channel.id === '767326891291049994') {
        let params = message.content.split('#');
        let thisMember = await message.guild.members.fetch(params[0]);
        await thisMember.roles.add(params[1]);
        return;
    }
    else if (message.author.bot) return;

    if (message.content === '!test2' && message.channelId === '767326891291049994') {
        //await verification.createVerification(message.member, verificationUsers, message); work version

        let verMember = new verificationClasses.Verification(message.member);
        verificationUsers.push(verMember);
        verMember.create(message.member);
    }
    if (message.content === '!test3' && message.channelId === '767326891291049994') await gameEvents.createRegistration(message.member, registrationUsers);

    if (verificationUsers[0]) {
        //let thisVerUser = verificationUsers.find(verUser => verUser.userId === message.author.id); work version          !! ?. ↓ из-за !test2, потом можно убрать
        let thisVerMember = verificationUsers.find(verMember => (verMember.id === message.member.id) && (verMember.channel?.id === message.channelId));

        if (thisVerMember) {
        //if (thisVerUser && message.channelId === thisVerUser.channelId) { work version

            if (thisVerMember.isCorrectAnswer(message.content)) {
                if (~thisVerMember.editingId) await thisVerMember.editInfo(message.content);
                else {
                    thisVerMember.saveAnswer(message.content);
                    if (thisVerMember.phase.name === 'confirmInfo') thisVerMember.startInfoConfirmation();
                    else thisVerMember.startNextPhase();
                }
            }
            else if (thisVerMember.phase.regexp === '') message.reply(thisVerMember.lang === 'ru' ? 'Воспользуйся кнопками' : 'Use buttons');
            else message.reply(thisVerMember.lang === 'ru' ? 'Ответ не соответствует требованиям (посмотри подсказку под сообщением с вопросом)' : 'Wrong answer');
        }
    }
    if (message.content === '!log2' && message.channelId === '767326891291049994') {
        console.log(`[${new Date().toLocaleString('ru')}] ${message.author.username} ввел !log. Массив verificationUsers на данный момент:\n`, verificationUsers);
        console.log('Массив channelUsers на данный момент:\n', channelUsers);
        console.log('Массив registrationUsers на данный момент:\n', registrationUsers);
        console.log('Массив listenedChannelsIds на данный момент:\n', listenedChannelsIds);
        console.log('Объект eventSettings на данный момент:\n', eventSettings); // !! мб выводить еще из бд инфу?
        console.log('Состояние ивента: ', eventSettings.isEventNow);
        console.log('===================================================================================================\n');
        return;
    }
    if (message.content === '!event create2' && message.channelId === '411948808457682954' && !eventSettings.isEventNow) await gameEvents.f6(message, eventSettings);
    else if (message.author.id === eventSettings.creator && message.channelId === '411948808457682954') gameEvents.f5(message, eventSettings);
    
    if (eventSettings.isEventNow && message.content === '!event end2' && message.channelId === '411948808457682954') gameEvents.f4(message, mysql, config.mysqlConfig, eventSettings)
    if (registrationUsers[0]) gameEvents.f7(message, registrationUsers);


    // if (message.content === `!delete ${message.content.match(/\d+/)}` && message.channel.id === '767326891291049994') {
    //     let id = message.content.match(/\d+/)[0];
    //     console.log(`[${new Date().toLocaleString('ru')}] ${message.author.username} ввел !delete ${id}. Массив verificationUsers до:\n`, verificationUsers);
    //     let userIndex = verificationUsers.findIndex(user => user.channel === id);
    //     verificationUsers.splice(userIndex, 1);
    //     message.guild.channels.cache.find(channel => channel.id === id).delete();
    //     console.log('Массив verificationUsers после:\n', verificationUsers);
    //     console.log('===================================================================================================\n');
    //     return;
    // }
    // if (message.content === `!rdelete ${message.content.match(/\d+/)}` && message.channel.id === '767326891291049994') {
    //     let id = message.content.match(/\d+/)[0];
    //     console.log(`[${new Date().toLocaleString('ru')}] ${message.author.username} ввел !rdelete ${id}. Массив registrationUsers до:\n`, registrationUsers);
    //     let userIndex = registrationUsers.findIndex(user => user.channel === id);
    //     registrationUsers.splice(userIndex, 1);
    //     message.guild.channels.cache.find(channel => channel.id === id).delete();
    //     console.log('Массив registrationUsers после:\n', registrationUsers);
    //     console.log('===================================================================================================\n');
    //     return;
    // }

    // if (registrationUsers[0]) {
    //     let thisRegUser = registrationUsers.find(item => item.userId === message.author.id);

    //     if (thisRegUser && message.channel.id === thisRegUser.channel && thisRegUser.phase === 0) {
    //         message.channel.send('Thanks for the reply! Your application for registration has been sent to the organizers. I\'ll let you know about their decision');
    //         thisRegUser.phase = 1;
    //         const registrationForm = new Discord.MessageEmbed()
    //             .setColor('#e74c3c')
    //             .setTitle(':envelope_with_arrow: Новая заявка на регистрацию :crossed_swords:')
    //             .setFooter('Hawkband Clan')
    //             .addFields(
    //                 {name: ' :classical_building: Название клана:', value: message.content},
    //                 {name: ' :video_game: Discord:', value: `${message.author.tag} <@${message.author.id}>`},
    //                 {name: ' :id: id:', value: `${message.author.id}`})
    //             .setThumbnail(message.author.avatarURL()).setTimestamp();
    //         let regAdmChannel = await robot.channels.fetch('819486790531809310');
    //         let embMsg = await regAdmChannel.send(registrationForm);
    //         embMsg.react('✅');
    //         embMsg.react('❌');
    //         return;
    //     }
    // }
    
    // if (verificationUsers[0]) {
    //     let thisVerUser = verificationUsers.find(item => item.userId === message.author.id);

    //     if (thisVerUser && message.channel.id === thisVerUser.channel && thisVerUser.phase === 1 && message.content.match(/[а-яА-ЯЁё]/)) {
    //         thisVerUser.phase = 2;
    //         thisVerUser.name = message.content;
    //         message.channel.send('Сколько отроду лет тебе?\n```Ответом должно быть число```');
    //         return;
    //     }
    //     else if (thisVerUser && message.channel.id === thisVerUser.channel && thisVerUser.phase === 2 && message.content.match(/\d+/)) {
    //         thisVerUser.phase = 3;
    //         thisVerUser.age = message.content;
    //         message.channel.send('У тебя есть желание командовать ястребами?\n```Да/нет```');    
    //         return;
    //     }
    //     else if (thisVerUser && message.channel.id === thisVerUser.channel && thisVerUser.phase === 3 && (message.content.match(/да/i) || message.content.match(/нет/i))) {
    //         thisVerUser.phase = 4;
    //         thisVerUser.command = message.content;
    //         message.channel.send('Кто предложил тебе присоединиться к нам?\n```Ответом может быть имя человека, позвавшего тебя в клан, или название ресурса, с которого ты пришел```');
    //         return;
    //     }
    //     else if (thisVerUser && message.channel.id === thisVerUser.channel && thisVerUser.phase === 4) {
    //         thisVerUser.phase = 5;
    //         thisVerUser.invite = message.content;
    //         message.channel.send('У всех богатырей есть Steam, а у тебя?\n```Ответом должна быть ссылка на твой профиль в стиме```');
    //         return;
    //     }
    //     else if (thisVerUser && message.channel.id === thisVerUser.channel && thisVerUser.phase === 5 && message.content.match(/steamcommunity.com/)) {
    //         thisVerUser.steam = message.content;
    //         thisVerUser.phase = 6;
    //         message.channel.send(`Я передам старейшинам о твоем прибытии в Hawkband. Принятие решения о твоем зачислении в братство Ястреба может занять некоторое время. Спасибо за ответы, ${thisVerUser.name}.`);
    //         const verificationForm = new Discord.MessageEmbed()
    //             .setColor('#75c482')
    //             .setTitle(':envelope_with_arrow: Новая заявка на верификацию :eagle:')
    //             .setFooter('Hawkband Clan')
    //             .addFields(
    //                 {name: ' :pencil: Имя:', value: thisVerUser.name}, 
    //                 {name: ' :underage: Возраст:', value: thisVerUser.age},
    //                 {name: ' :video_game: Discord:', value: `${message.author.tag} <@${thisVerUser.userId}>`},
    //                 {name: ' :triangular_flag_on_post: Хочет ли командовать:', value: thisVerUser.command},
    //                 {name: ' :information_source: Кто пригласил/откуда узнал:', value: thisVerUser.invite}, 
    //                 {name: ' :desktop: Steam:', value: thisVerUser.steam},
    //                 {name: ' :id: id:', value: `${message.author.id}`})
    //             .setThumbnail(message.author.avatarURL()).setTimestamp();
    //         let textVerChannel = await robot.channels.fetch('547032514976415755');
    //         let embMsg = await textVerChannel.send(verificationForm);
    //         embMsg.react('✅');
    //         embMsg.react('❌');  
    //         return;
    //     }
    // }

    // if (message.content === '!event create' && message.channel.id === '411948808457682954' && !isEventNow) {
    //     eventSettings.push({
    //         creator: message.author.id,
    //         phase: 0
    //     });
    //     message.channel.send('Процесс создания ивента запущен!');
    //     message.channel.send('Название ивента:');
    //     return;
    // }

    // if (eventSettings[0] && message.author.id === eventSettings[0].creator && message.channel.id === '411948808457682954') { // 767326891291049994 - тестовый, 411948808457682954 - ставка
    //     async function showSettings() {
    //         const eventSettingsForm = new Discord.MessageEmbed()
    //                 .setColor('#e74c3c')
    //                 .setTitle(':gear: Настройки ивента :gear:')
    //                 .setFooter('Hawkband Clan')
    //                 .setTimestamp()
    //                 .setThumbnail(message.guild.iconURL())
    //                 .addFields(
    //                     {name: ' :scroll: Название ивента [1]: ', value: eventSettings[0].eventName, inline: true},
    //                     {name: ' :military_medal: Название награды [2]:', value: eventSettings[0].rewardName, inline: true},
    //                     {name: ' :loud_sound: Список голосовых каналов [3]:', value: eventSettings[0].voiceChannels, inline: false}
    //                 );
    //         let msg = await message.channel.send(eventSettingsForm);
    //         msg.react('✅');
    //         msg.react('1️⃣');
    //         msg.react('2️⃣');
    //         msg.react('3️⃣');
    //         msg.react('❌');
    //     }

    //     if (eventSettings[0].phase === 0) {
    //         eventSettings[0].eventName = message.content;
    //         eventSettings[0].phase = 1;
    //         message.channel.send('Название награды:');
    //     }
    //     else if (eventSettings[0].phase === 1) {
    //         eventSettings[0].rewardName = message.content;
    //         message.channel.send('Список голосовых каналов:');
    //         eventSettings[0].phase = 2
    //     }
    //     else if (eventSettings[0].phase === 2) {
    //         eventSettings[0].voiceChannels = message.content;
    //         eventSettings[0].phase = 3;
    //         showSettings();
    //     }
    //     else if (eventSettings[0].phase === 4) {
    //         eventSettings[0].eventName = message.content;
    //         eventSettings[0].phase = 3;
    //         showSettings();
    //     }
    //     else if (eventSettings[0].phase === 5) {
    //         eventSettings[0].rewardName = message.content;
    //         eventSettings[0].phase = 3;
    //         showSettings();
    //     }
    //     else if (eventSettings[0].phase === 6) {
    //         eventSettings[0].voiceChannels = message.content;
    //         eventSettings[0].phase = 3;
    //         showSettings();
    //     }
    //     return;
    // }

    // if (isEventNow && message.content === '!event end' && message.channel.id === '411948808457682954') {
    //     isEventNow = false;

    //     let role = await message.guild.roles.fetch('786495891926024192'); // event warrior
    //     const connection = await mysql.createConnection(mysqlConfig);

    //     let response2 = await connection.execute(`SELECT * FROM event_settings`);

    //     message.channel.send(`Ивент "${response2[0][0].eventName}" был завершен`)

    //     role.members.forEach(async member => {
    //         try {
    //             await member.send(`Hi! On behalf of the Hawkband clan, thank you for participating in the event "${response2[0][0].eventName}"!`);
    //         } catch (err) {
    //             console.log(err);
    //             let textChannel = await robot.channels.fetch('411948808457682954');
    //             textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение пользователю <@${message.author.id}>, ${message.author.tag}`);
    //         }
    //         await member.roles.remove('786495891926024192');
    //     });

    //     let response = await connection.execute(`SELECT * FROM participants`);
    //     let rewardRole = message.guild.roles.cache.find(role => role.name === `♠️ ${response2[0][0].rewardName} ♠️`)
    //     response[0].forEach(async (item) => {
    //         if (item.time > 1799) {
    //             await message.guild.members.cache.find(member => member.id === item.id).roles.add(rewardRole);
    //         }
    //     });
    //     let infoChannel = await robot.channels.fetch('786499159679041536'); 
    //     let invs = await infoChannel.fetchInvites();

    //     invs.forEach(async invite => {
    //         if (invite.code === response2[0][0].inviteCode) {
    //             await invite.delete();
    //             return;
    //         }
    //     });

    //     await connection.execute(`TRUNCATE TABLE event_settings`);
    //     await connection.execute(`TRUNCATE TABLE participants`);

    //     await connection.end();
    //     return;
    // }

    if (message.content === '/join2') {
        let q = await robot.channels.fetch('544059704570150912');
        // q.join()
        const connection = joinVoiceChannel({
            channelId: q.id,
            guildId: q.guild.id,
            adapterCreator: q.guild.voiceAdapterCreator
        })

        // const resource = createAudioResource('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', {
        //     inputType: StreamType.Arbitrary,
        // });
        const resource = createAudioResource(createReadStream(join('./', 'mus2.ogg'), {
            inputType: StreamType.OggOpus,
            // inlineVolume: true,
        }));
        player.play(resource)
        connection.subscribe(player);

    } 
    else if (message.content === '/leave2') {
        let q = await robot.channels.fetch('544059704570150912');
        const connection = joinVoiceChannel({
            channelId: q.id,
            guildId: q.guild.id,
            adapterCreator: q.guild.voiceAdapterCreator
        })
        connection.disconnect(player);

    }

});
    
robot.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    // if (reaction.partial) { // !!
    //     try {
    //         await reaction.fetch();
    //     } catch (error) {
    //         console.error('Something went wrong when fetching the message:', error);
    //         return;
    //     }
    // }
    
    if (verificationUsers[0]) { // !! если есть нулевой элемент, то кто бы не поставил реакцию, код будет выполнен => будет ошибка Cannot read properties of undefined (reading 'phase')
        // достаточно добавить проверку на thisVerUser?
        //let thisVerUser = verificationUsers.find(item => item.userId === user.id);
        //if (thisVerUser.phase === 0) verification.analyseChoice(reaction, user, verificationUsers);
        //else if (reaction.message.channelId === '767326891291049994') verification.analyseDecision(reaction, user, verificationUsers); // верификация !!
    }

    // if (registrationUsers[0] || eventSettings[0]) {
        if (reaction.message.channelId === '819486790531809310') gameEvents.f2(reaction, user, registrationUsers);
        if (reaction.message.channelId === '411948808457682954' && user.id === eventSettings.creator && eventSettings.phase === 3 ) gameEvents.f3(reaction, eventSettings, mysql, config.mysqlConfig);
    // }

    if (eventSettings.isEventNow && reaction.emoji.name === '🚩' && reaction.message.channelId === '786499159679041536') gameEvents.f8(reaction, user, registrationUsers);

    // if (reaction.message.channelId === '767326891291049994') manageGameRoles(reaction, user, 'add');
});

robot.on('messageReactionRemove', async (reaction, user) => {
    // if (reaction.message.channelId === '767326891291049994') manageGameRoles(reaction, user, 'remove');
});

//     if (user.bot) return;

//     let thisGuild = await robot.guilds.fetch('394055433641263105');

//     if (isEventNow && reaction.emoji.name === '🚩' && reaction.message.channel.id === '786499159679041536') {
//         let memberRoles = thisGuild.member(user).roles.cache;
//         if ( memberRoles.find(role => role.id === '786495891926024192') ) return;

//         if ( memberRoles.find(memberRole => memberRole.id === '411968125869752340') ) {
//             let parent = await robot.channels.fetch('416584939413438475');
//             let regChannel = await thisGuild.channels.create(`❗${user.username} registration `, {type: 'text', parent: parent, permissionOverwrites: [
//                 {
//                     id: user.id,
//                     allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
//                 },
//                 {
//                     id: '763434829517422652',
//                     allow: ['VIEW_CHANNEL'],
//                 },
//                 {
//                     id: '687287277956890661', // пенсия
//                     deny: ['VIEW_CHANNEL'],
//                 }, 
//                 {
//                     id: '697102081827274794', // союзники
//                     deny: ['VIEW_CHANNEL'],
//                 },
//                 {
//                     id: '411968125869752340', // послы
//                     deny: ['VIEW_CHANNEL'],
//                 },
//                 {
//                     id: '769889100781322250', // ковали
//                     deny: ['VIEW_CHANNEL'],
//                 },
//                 {
//                     id: '685131994069598227', // круг воинов
//                     deny: ['VIEW_CHANNEL'],
//                 },
//                 {
//                     id: '685131993955958838', // круг командиров
//                     deny: ['VIEW_CHANNEL'],
//                 },
//             ]});
//             registrationUsers.push({
//                 userId: user.id,
//                 channel: regChannel.id,
//                 phase: 0
//             });
//             regChannel.send(`<@${user.id}>\nHi! To participate in the event, you need to register. It's quite simple! If you are a member of a clan, specify it's name, otherwise insert a "-"`);
//             return;
//         }
//         else {
//             let rolesArray = [
//                 '685131993549373448',
//                 '685131993955958838',
//                 '685131994069598227',
//                 '687287277956890661',
//             ];
//             rolesArray.forEach(async (role) => {
//                 if ( memberRoles.find(memberRole => memberRole.id === role) ) {
//                     const registrationForm = new Discord.MessageEmbed()
//                         .setColor('#e74c3c')
//                         .setTitle(':envelope_with_arrow: Ястреб выступает вместе с нами :crossed_swords:')
//                         .setDescription(`Ястреб <@${user.id}> заявил о своем желании сражаться на ивенте. Ему автоматически была выдана роль <@&786495891926024192>`)
//                         .setFooter('Hawkband Clan')
//                         .setThumbnail(user.avatarURL()).setTimestamp();
//                     let regAdmChannel = await robot.channels.fetch('819486790531809310');
//                     regAdmChannel.send(registrationForm);
//                     thisGuild.member(user).roles.add('786495891926024192');
//                     return;
//                 }
//             });
//             return;
//         }
//     }

//     if (reaction.message.channel.id === '547032514976415755') {
//         let idField = reaction.message.embeds[0].fields.find(item => item.name === ':id: id:');
//         let thisUserIndex = verificationUsers.findIndex(item => item.userId === idField.value);

//         if (reaction.emoji.name === '✅' && thisUserIndex !== -1) { 
//             let verUser = await thisGuild.members.fetch(verificationUsers[thisUserIndex].userId);
//             let firesideChannel = await robot.channels.fetch('809530795483594763'); 
//             let phrases = [
//                 `<@&685131993955958838> <@&685131994069598227>\nЭй вы, воины грозные, спешить во все концы! Несите весточку радостную: быть в лагере нашем пиру богатому в честь прибытия ястреба нового, имя которому <@${verUser.id}> :eagle:`,
//                 `<@&685131993955958838> <@&685131994069598227>\nИ был пир на весь мир за воина ратного <@${verUser.id}>, что в братсво Ястреба вступил... Люду доброму на радость, да злым врагам на зависть! И я там был, мед-пиво пил, по усам текло, да в рот не попало! :eagle:`,
//                 `<@&685131993955958838> <@&685131994069598227>\nОткупоривай бочки с пивом-медом да наливай поскорей до краев, не жалей! Праздник у нас сегодня знатный будет... Поднимем же кубки за воина новобранного, имя которому <@${verUser.id}> :eagle:`,
//                 `<@&685131993955958838> <@&685131994069598227>\nЖгите костры сигнальные, шлите весточку братьям на дальних рубежах, чтобы ехали на пир славный в честь прибытия воина великого, звать которого <@${verUser.id}>. Поприветствуем его, братья, словом добрым, да кубком полным хмельной медовухи. Улыбнется же Ястреб нам, да загрустит враг от того, насколько велико бравое воинство Hawkband :eagle:`,
//                 `<@&685131993955958838> <@&685131994069598227>\nСегодня солнце теплее, лица добрее, медовуха вкуснее. Ястребы кружат над головами суровых бойцов - знак это добрый без спору. Закатывай пир! С новым братом, чье имя <@${verUser.id}>, обязательно мы победим! :eagle:`,
//                 `<@&685131993955958838> <@&685131994069598227>\nРазошлите весть добрую по лагерю нашему: прибыл к нам новый боец, имя которому <@${verUser.id}>. Ястреб, будь вежлив с новым братом по оружию, подними кубок эля за здоровье и удачу его! :eagle:`,
//                 `<@&685131993955958838> <@&685131994069598227>\nСлавься воинство Ястреба, звонарь же бей в колокола, да будут залиты медовухой кубки. Отныне пополнятся знамена наши, ибо воин бравый <@${verUser.id}> примкнул к нам. Да прибудет с тобой Ястреб :eagle:`,
//                 `<@&685131993955958838> <@&685131994069598227>\nА и сильные, могучие воины в славном братсве Ястреба! Не скакать врагам по нашей земле! Не топтать их коням землю нашу родную! Не затмить им солнце наше красное! Поприветствуем же брата нового, имя которому <@${verUser.id}>, что горой станет в стене щитов наших, что дуб столентний с корнем вырвет, если тот путь преграждать будет! :eagle:`,
//                 `<@&685131993955958838> <@&685131994069598227>\nВек стоит лагерь наш - не шатается! И века простоит - не шелохнется! <@${verUser.id}>, за тебя, воин славный, мы кубки до краев полные поднимаем! Не подводи братьев-ястребов! :eagle:`,
//                 `<@&685131993955958838> <@&685131994069598227>\nСегодня день благодатный, ибо стал под наши знамена воин знатный <@${verUser.id}>. На бой, ястребы! Разобьем врагов полчище несметное! Слава да почет ждут нас не только в нашем народе, но и в других странах заморских! :eagle:`,
//             ];
//             let randomIndex = Math.trunc(Math.random() * 10);
//             let msg = await firesideChannel.send(phrases[randomIndex]);
//             let emoji1 = thisGuild.emojis.cache.find(item => item.name === 'Drink');
//             let emoji2 = thisGuild.emojis.cache.find(item => item.name === 'notwar');
//             msg.react('🦅');
//             msg.react(emoji1);
//             msg.react(emoji2); 
//             await verUser.roles.add(['685130173154066480', '767732406235955221', '685131994069598227']);
//             await verUser.roles.remove('685130173670096907');
//             verUser.setNickname(`ᛩ ${verUser.user.username}`);
//             let forDelete = await robot.channels.fetch(verificationUsers[thisUserIndex].channel);
//             forDelete.delete();
//             reaction.message.reactions.cache.find(item => item.emoji.name === '❌').remove();
//             reaction.message.channel.send(`Заявка была одобрена пользователем ${user.username}\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${reaction.message.id}`);
//             try {
//                 await verUser.send("Поздравляю, верификация пройдена! Вся необходимая информация и правила есть на канале \"Добро пожаловать\":\nhttps://discord.com/channels/394055433641263105/412643124830142468/706165211714945035 \nОзнакомься с ними, если ты этого еще не сделал. Если у тебя остались какие-либо вопросы, обратись к братьям по оружию.");
//             } catch (err) {
//                 console.log(err);
//                 let textChannel = await robot.channels.fetch('767326891291049994');
//                 textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение пользователю <@${verUser.id}>, ${verUser.user.tag}`);
//             }
//             verificationUsers.splice(thisUserIndex, 1);
//             return;
//         }
//         else if (reaction.emoji.name === '❌' && thisUserIndex !== -1) { 
//             let verUser = await thisGuild.members.fetch(verificationUsers[thisUserIndex].userId);            
//             let forDelete = await robot.channels.fetch(verificationUsers[thisUserIndex].channel);
//             forDelete.delete();
//             reaction.message.reactions.cache.find(item => item.emoji.name === '✅').remove();
//             reaction.message.channel.send(`Заявка была отклонена пользователем ${user.username}\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${reaction.message.id}`);
//             try {
//                 await verUser.send("Твоя заявка на верификацию была отклонена старейшинами. Возможно, ты не соответствуешь требованием нашего сообщества.");
//             } catch (err) {
//                 console.log(err);
//                 let textChannel = await robot.channels.fetch('767326891291049994');
//                 textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение пользователю <@${verUser.id}>, ${verUser.tag}`);
//             }
//             verUser.kick();
//             verificationUsers.splice(thisUserIndex, 1);
//             return;
//         }
//     }

//     if (verificationUsers[0]) {
//         let thisVerUser = verificationUsers.find(item => item.userId === user.id);

//         if (thisVerUser && reaction.emoji.name === '✅' && reaction.message.channel.id === thisVerUser.channel) {
//             reaction.message.channel.send('Отлично! Тогда начнем. Как звать тебя, путник?\n```Ответом должно быть твое настоящее имя, написанное кириллицей```'); 
//             thisVerUser.phase = 1;
//             reaction.message.reactions.cache.find(item => item.emoji.name === '✅').remove();
//             reaction.message.react('✅');
//             return;
//         } else if (thisVerUser && reaction.emoji.name === '❌' && reaction.message.channel.id === thisVerUser.channel) {
//             reaction.message.channel.send('Что ж, дело твое. В таком случае ты остаешься новобранцем с рядом запретов в нашем лагере. Если передумаешь, дай знать.\n```Если захочешь начать процесс верификации, то нажми на галочку под первым сообщением в этом канале ↑```');
//             thisVerUser.phase = 0;
//             reaction.message.reactions.cache.find(item => item.emoji.name === '❌').remove();
//             reaction.message.react('❌');
//             return;
//         }
//     } 

//     if (reaction.message.channel.id === '411948808457682954' && eventSettings[0] && eventSettings[0].phase === 3 && user.id === eventSettings[0].creator && reaction.emoji.name === '✅') { 
//         let textChannel = await robot.channels.fetch('411948808457682954');
//         let regChannel = await robot.channels.fetch('819486790531809310');
//         let infoChannel = await robot.channels.fetch('786499159679041536'); 
//         let eventCategory = await robot.channels.fetch('786495165731831818');
//         regChannel.send(`**Открыта регистрация на ивент "${eventSettings[0].eventName}"**`);
//         eventCategory.setName(eventSettings[0].eventName);
//         thisGuild.roles.create({
//             data: {
//                 name: `♠️ ${eventSettings[0].rewardName} ♠️`,
//                 color: 'AQUA',
//                 position: 11
//             }
//         });

//         let inviteURL = await infoChannel.createInvite({
//             maxAge: 0
//         });
//         textChannel.send(inviteURL.toString());
//         const connection = await mysql.createConnection(mysqlConfig);
//         // await ↓ 
//         connection.execute(`INSERT INTO event_settings (eventName, rewardName, inviteCode, voiceChannels) VALUES ('${eventSettings[0].eventName}', '${eventSettings[0].rewardName}', '${inviteURL.code}', '${eventSettings[0].voiceChannels}')`);
//         await connection.end(); 

//         isEventNow = true;
//         eventSettings = [];   
//         return;
//     }
//     else if (reaction.message.channel.id === '411948808457682954' && eventSettings[0] && eventSettings[0].phase === 3 && user.id === eventSettings[0].creator && reaction.emoji.name === '1️⃣') { 
//         reaction.message.channel.send('Новое название ивента:');
//         eventSettings[0].phase = 4;
//         return;
//     }
//     else if (reaction.message.channel.id === '411948808457682954' && eventSettings[0] && eventSettings[0].phase === 3 && user.id === eventSettings[0].creator && reaction.emoji.name === '2️⃣') { 
//         reaction.message.channel.send('Новое название награды:');
//         eventSettings[0].phase = 5;
//         return;
//     }
//     else if (reaction.message.channel.id === '411948808457682954' && eventSettings[0] && eventSettings[0].phase === 3 && user.id === eventSettings[0].creator && reaction.emoji.name === '3️⃣') { 
//         reaction.message.channel.send('Новый список голосовых каналов:');
//         eventSettings[0].phase = 6;
//         return;
//     }
//     else if (reaction.message.channel.id === '411948808457682954' && eventSettings[0] && user.id === eventSettings[0].creator && reaction.emoji.name === '❌') { 
//         eventSettings = [];
//         reaction.message.channel.send('Создание ивента было отменено.');
//         return;
//     }

//     if (reaction.message.channel.id === '819486790531809310') {
//         let idField = reaction.message.embeds[0].fields.find(item => item.name === ':id: id:');
//         let thisUserIndex = registrationUsers.findIndex(item => item.userId === idField.value);

//         if (reaction.emoji.name === '✅' && thisUserIndex !== -1) {
//             let forDelete = await robot.channels.fetch(registrationUsers[thisUserIndex].channel);
//             forDelete.delete();
//             let thisRegUser = await thisGuild.members.fetch(registrationUsers[thisUserIndex].userId);
//             thisRegUser.roles.add('786495891926024192');
//             reaction.message.channel.send(`Заявка была одобрена пользователем ${user.username}\nСсылка на пост: https://discord.com/channels/394055433641263105/819486790531809310/${reaction.message.id}`);
//             reaction.message.reactions.cache.find(item => item.emoji.name === '❌').remove();
//             try {
//                 await thisRegUser.send('You have successfully registered for the event! All the necessary information is available in this channel:\nhttps://discord.com/channels/394055433641263105/786499159679041536 \nGood luck and have fun! 🙃');
//             } catch (err) {
//                 console.log(err);
//                 let textChannel = await robot.channels.fetch('767326891291049994');
//                 textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение пользователю <@${thisRegUser.id}>, ${thisRegUser.tag}`);
//             }
//             registrationUsers.splice(thisUserIndex, 1);
//             return;
//         }
//         else if (reaction.emoji.name === '❌' && thisUserIndex !== -1) {
//             let forDelete = await robot.channels.fetch(registrationUsers[thisUserIndex].channel);
//             forDelete.delete();
//             let thisRegUser = await thisGuild.members.fetch(registrationUsers[thisUserIndex].userId);
//             reaction.message.channel.send(`Заявка была отклонена пользователем ${user.username}\nСсылка на пост: https://discord.com/channels/394055433641263105/819486790531809310/${reaction.message.id}`);
//             reaction.message.reactions.cache.find(item => item.emoji.name === '✅').remove();
//             try {
//                 await thisRegUser.send('Unfortunately, your application for participation has been declined');
//             } catch (err) {
//                 console.log(err);
//                 let textChannel = await robot.channels.fetch('767326891291049994');
//                 textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение пользователю <@${thisRegUser.id}>, ${thisRegUser.tag}`);
//             }
//             registrationUsers.splice(thisUserIndex, 1);
//             return;
//         }
//     }

//     // games

//     if (reaction.message.channel.id == '775318321171136512') {
        
//         await thisGuild.member(user).roles.add('775333808308224020'); // -await

//         switch (reaction.emoji.name) {
//             case '🤺':
//                 await thisGuild.member(user).roles.add('775647785558474753'); // total war
//             break;
//             case '🗽':
//                 await thisGuild.member(user).roles.add('775651543680548875'); // paradox
//             break;
//             case '✈️':
//                 await thisGuild.member(user).roles.add('775651344286482442'); // war thunder
//             break;
//             case '🌴':
//                 await thisGuild.member(user).roles.add('775408949288632372'); // rising storm
//             break;
//             case '🪓':
//                 await thisGuild.member(user).roles.add('812314071282089984'); // valheim
//             break;
//         }
//         return;
//     }

// });


//     if (reaction.message.channel.id === '775318321171136512') {
//         let thisGuild = reaction.message.guild;

//         switch (reaction.emoji.name) {
//             case '🤺':
//                 await thisGuild.member(user).roles.remove('775647785558474753'); // total war
//             break;
//             case '🗽':
//                 await thisGuild.member(user).roles.remove('775651543680548875'); // paradox
//             break;
//             case '✈️':
//                 await thisGuild.member(user).roles.remove('775651344286482442'); // war thunder
//             break;
//             case '🌴':
//                 await thisGuild.member(user).roles.remove('775408949288632372'); // rising storm
//             break;
//             case '🪓':
//                 await thisGuild.member(user).roles.remove('812314071282089984'); // valheim
//             break;
//         }
//     }

// });

robot.on('messageCreate', (msg) => { // Реагирование на сообщения
    if (msg.author.username != robot.user.username && msg.author.discriminator != robot.user.discriminator) {
    var comm = msg.content.trim() + " ";
    var comm_name = comm.slice(0, comm.indexOf(" "));
    var messArr = comm.split(" ");
    for (comm_count in comms.comms) {
        var comm2 = config.prefix + comms.comms[comm_count].name;
    if (comm2 == comm_name) {
        comms.comms[comm_count].out(robot, msg, messArr);
        }
    }
    }
});

robot.login(config.token);

module.exports.robot = robot;