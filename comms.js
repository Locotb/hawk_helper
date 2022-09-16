// const config = require('./config.json'); // Подключаем файл с параметрами и информацией
const { Client, Intents } = require('discord.js');
// const mysql = require('mysql2/promise');
// const mysqlConfig = config.mysql; // можно не создавать переменную, а юзать config.mysql


// // const Discord = require('discord.js'); // Подключаем библиотеку discord.js
// const prefix = config.prefix; // «Вытаскиваем» префикс

// // Команды //

// function test(robot, mess, args) {
//     mess.channel.send('Test! ' + args[1])
// }

// async function help(robot, message, args) {

//     try {
//         await message.author.send("**Список команд:**\n`!data` - вывести статистику в текстовой канал, в котором была прописана команда\n`!data private` - вывести статистику в лс\n**Примечание:** команды `!data` и `!data private` доступны только в канале \"Летопись Добрыни\"!\n\n**Старейшинам:**\n`!event create` - создать ивент\n`!event end` - завершить ивент\n`!notice id text` - разослать text всем, у кого есть роль с таким id\n`!delete id` - удалить процесс верификации и канал с таким id\n`!rdelete id` - удалить процесс регистрации и канал с таким id");
//         await message.reply("я выслал список команд тебе в лс");
//     } catch (err) {
//         await message.reply("я не смог отправить сообщение тебе в лс");
//         console.log(err);
//         let textChannel = await robot.channels.fetch('411948808457682954');
//         textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение пользователю <@${message.author.id}>, ${message.author.tag}`);
//     }

// }

// async function data(robot, message, args) {

//     if (message.channel.id !== '772379655113408512' && message.channel.id !== '767326891291049994') return;
    
//     const exampleEmb = new Discord.MessageEmbed()
//         .setColor(message.member.roles.color.color)
//         .setTitle(':bar_chart: Онлайн ястребов')
//         .setFooter('Hawkband Clan');

//     const connection = await mysql.createConnection(mysqlConfig);
//     let Data = new Date();
//     let month = Data.getMonth();

//         try {
//             let response = await connection.execute('SELECT * FROM `time_online`');
//             let msg = response[0].find(item => item.id === message.author.id)[`time${month}`];
//             let msg2 = response[0].find(item => item.id === message.author.id).totalTime;
//             exampleEmb.addFields(
//                 {name: ' :eagle: Твое время на службе в этом месяце:', value: `:clock4: ${(msg/3600).toFixed(2)} часов(-а)`}, 
//                 {name: ' :eagle: За все время ты отслужил:', value: `:clock4: ${(msg2/3600).toFixed(2)} часов(-а)`} 
//             ).setThumbnail(message.author.avatarURL()).setTimestamp();

//             if (args[1] === 'private') {
//                 await message.author.send(exampleEmb);
//                 await message.reply("я выслал статистику тебе в лс");    
//             } else {
//                 message.channel.send(exampleEmb);
//             }

//         } catch (err) {
//             if (err.name == 'TypeError' && err.message == `Cannot read property 'time${month}' of undefined`) {
//                 message.reply("на данный момент в базе данных нет информации о тебе");
//             } else {
//                 message.reply("что-то пошло не так. Пожалуйста, сообщи об этом разработчику <@318010463948374017>");
//                 console.log(err);
//             } 
//         }      

//     connection.end(); 
// }


// async function notice(robot, message, args) {
//     if (message.channel.id !== '411948808457682954') return;
//     if (!args[1]) {
//         message.reply('используй !notice @[роль] [сообщение]');
//         return;
//     }
//     let roleId = args[1].match(/\d+/) ? args[1].match(/\d+/)[0] : '0';
//     let role = await message.guild.roles.fetch(roleId);

//     if (!role) {
//         message.reply('неверно указана роль. Используй !notice @[роль] [сообщение]');
//         return;
//     } else { 
//         args.splice(0, 2);
//         if (!args[0]) {
//             message.reply('не найден текст оповещения. Используй !notice @[роль] [сообщение]');
//             return;
//         }
//         let text = args.join(' ');
//         role.members.forEach(async (member) => {
//             try {
//                 await member.send(text);
//             } catch (err) {
//                 console.log(`[${new Date().toLocaleString('ru')}] Ошибка при рассылке оповещений\n`, err); 
//                 console.log('===================================================================================================\n');
//                 let textChannel = await robot.channels.fetch('825328725297201184');
//                 textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение пользователю <@${member.id}>, ${member.user.tag}`);
//             }
//         });
//         message.reply(`рассылка оповещений завершена`);
//     }
// }

// // async function notice(robot, message, args) {
// //     if (message.channel.id !== '411948808457682954') return;
// //     let role = await message.guild.roles.fetch(args[1]);
// //     args.splice(0, 2);
// //     let text = args.join(' ')
// //     role.members.forEach(async (member) => {
// //         try {
// //             await member.send(text);
// //         } catch (err) {
// //             console.log(err);
// //             let textChannel = await robot.channels.fetch('411948808457682954');
// //             textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение пользователю <@${member.id}>, ${member.user.tag}`);
// //         }
// //     });
// // }

// // Список команд //

// var comms_list = [
// {
//     name: "test",
//     out: test,
//     about: "Тестовая команда"
// },

// {
//     name: "data",
//     out: data,
//     about: "Выводит информацию из бд"
// },

// {
//     name: "help",
//     out: help,
//     about: "Отправляет список команд в лс"
// },

// {
//     name: "notice",
//     out: notice,
//     about: "Отправить уведомление тем, у кого есть роль event warrior"
// },

// ];

// // Name - название команды, на которую будет реагировать бот
// // Out - название функции с командой
// // About - описание команды 

// module.exports.comms = comms_list;