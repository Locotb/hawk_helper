const config = require('./config.json'); // Подключаем файл с параметрами и информацией
const Discord = require('discord.js'); // Подключаем библиотеку discord.js
const prefix = config.prefix; // «Вытаскиваем» префикс
const mysql = require('mysql2/promise');
let mysqlConfig = require('./config-mysql.json');

// Команды //

function test(robot, mess, args) {
    mess.channel.send('Test! ' + args[1])
}

function help(robot, message, args) {

    message.reply("я выслал список команд тебе в лс.");
    message.author.send("`!data` - вывести статистику в текстовой канал, в котором была прописана команда;\n`!data private` - вывести статистику в лс.");

}

async function data(robot, message, args) {

    if (message.channel != '772379655113408512' && message.channel != '767326891291049994') return;
    
    const exampleEmb = new Discord.MessageEmbed()
        // .setColor('#27E5A0')
        .setColor(message.member.roles.color.color)
        .setTitle(':bar_chart: Онлайн ястребов :eagle:')
        .setFooter('Hawkband Clan');

    const connection = await mysql.createConnection(mysqlConfig);
    let Data = new Date();
    let month = Data.getMonth();

        try {
            let response = await connection.execute('SELECT * FROM `time_online`');
            let msg = response[0].find(item => item.id == message.author.id)[`time${month}`];
            let msg2 = response[0].find(item => item.id == message.author.id).totalTime;
            exampleEmb.addFields(
                {name: ' <:hawkband:620744081533829121> Твое время на службе в этом месяце:', value: `:clock4: ${(msg/3600).toFixed(2)} часов(-а)`}, 
                {name: ' <:hawkband:620744081533829121> За все время ты отслужил:', value: `:clock4: ${(msg2/3600).toFixed(2)} часов(-а)`} 
            ).setThumbnail(message.author.avatarURL()).setTimestamp();

            if (args[1] == 'private') {
                message.author.send(exampleEmb);
                message.reply("я выслал статистику тебе в лс.");
            } else {
                message.channel.send(exampleEmb);
            }

        } catch (err) {
            if (err.name == 'TypeError' && err.message == `Cannot read property 'time${month}' of undefined`) {
                message.reply("на данный момент в базе данных нет информации о тебе.");
            } else {
                message.reply("что-то пошло не так. Пожалуйста, сообщи об этом разработчику <@318010463948374017>");
                console.log(err);
            } 
        }      

    connection.end(); 
}

// Список команд //

var comms_list = [
{
    name: "test",
    out: test,
    about: "Тестовая команда"
},

{
    name: "data",
    out: data,
    about: "выводит информацию из бд"
},

{
    name: "help",
    out: help,
    about: "отправляет список команд в лс"
},

];

// Name - название команды, на которую будет реагировать бот
// Out - название функции с командой
// About - описание команды 

module.exports.comms = comms_list;