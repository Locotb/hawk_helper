const Discord = require('discord.js'); // Подключаем библиотеку discord.js
const robot = new Discord.Client(); // Объявляем, что robot - бот
const comms = require("./comms.js"); // Подключаем файл с командами для бота
const fs = require('fs'); // Подключаем родной модуль файловой системы node.js  
let config = require('./config.json'); // Подключаем файл с параметрами и информацией
const { send } = require('process');
let token = config.token; // «Вытаскиваем» из него токен
let prefix = config.prefix; // «Вытаскиваем» из него префикс
let channelUsers = [];
const mysql = require('mysql2/promise');
let mysqlConfig = require('./config-mysql.json');
let verificationUsers = [];

robot.on('ready', async function() {
  /* При успешном запуске, в консоли появится сообщение «[Имя бота] запустился!» */
    console.log(robot.user.username + " запустился!");
    console.log('===================================================================================================\n');    
    
});

robot.on('guildMemberAdd', async (member) => {

    await member.roles.add('685130173670096907');
    let thisGuild = await robot.guilds.fetch('394055433641263105');
    let parent = await robot.channels.fetch('416584939413438475');
    let fortext = await thisGuild.channels.create(`Верификация ${member.user.username}`, {type: 'text', parent: parent, permissionOverwrites: [
        {
            id: member.id,
            allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
        },
        {
            id: '318010463948374017',
            allow: ['VIEW_CHANNEL'],
        },
        {
            id: '763434829517422652',
            allow: ['VIEW_CHANNEL'],
        },
        {
            id: '687287277956890661', // пенсия
            deny: ['VIEW_CHANNEL'],
        }, 
        {
            id: '697102081827274794', // союзники
            deny: ['VIEW_CHANNEL'],
        },
        {
            id: '411968125869752340', // послы
            deny: ['VIEW_CHANNEL'],
        },
        {
            id: '769889100781322250', // ковали
            deny: ['VIEW_CHANNEL'],
        },
        {
            id: '685131994069598227', // круг воинов
            deny: ['VIEW_CHANNEL'],
        },
        {
            id: '685131993955958838', // круг командиров
            deny: ['VIEW_CHANNEL'],
        },
    ]});

    let msg = await fortext.send("Приветствую тебя, путник. Меня зовут Добрыня, я помогу тебе освоиться здесь. Для начала мне нужно собрать о тебе некоторую информацию и донести ее до самых почетных и уважаемых членов нашего братства. Идет?```1) Нажми на галочку, если хочешь начать процесс верификации\n2) Нажми на крестик, если ты не хочешь начинать процесс верификации или если хочешь его отменить```");
    msg.react('✅');
    msg.react('❌');

    verificationUsers.push({
        userId: member.user.id,
        etap: 0,
        channel: fortext.id,
    });
    
});

robot.on('voiceStateUpdate', async (oldState, newState) => {

    let textChannel = await robot.channels.fetch('767326891291049994'); // текстовый
    if (!textChannel) return console.log("could not find channel");

    let userName = newState.member.user.username;

    let userRole; 
    let rolesArray = [
    '411942349753548800', 
    '681420100565467157', 
    '681410021463949322', 
    '684046420000374950', 
    '684046428783378435', 
    '684046480247488514',
    '685130078098948099',
    '685130164061208787', 
    '685130169195036700',
    '685130171040268414',
    '685130172047163490', 
    '685130173154066480', 
    '687287277956890661', 
    ];
    
    for (let i = 0; i < rolesArray.length; i++) {
        let role = newState.member.roles.cache.find(item => item.id == rolesArray[i]);
        if (role) {
            userRole = role.name;
            break;
        }
    }

    if (userRole === undefined) return;

    let newUserChannel = newState.channelID;
    let oldUserChannel = oldState.channelID;

    recordingChannels = [
        '480807623525007361',
        '544059704570150912',
        '398099895569088513',
        '777820894306238484',
    ];

    let newRecVC = recordingChannels.find(elem => elem == newUserChannel);
    let oldRecVC = recordingChannels.find(elem => elem == oldUserChannel);

    let timeInChannel;

    if (newRecVC && !oldRecVC) {
        // if ((oldUserChannel == undefined || oldUserChannel == '704233423794995312' || oldUserChannel == '704233467012972564' || oldUserChannel == '704233511145701497' || oldUserChannel == '696666666628546662' || oldUserChannel == '411951021536051202') && (newUserChannel == '480807623525007361' || newUserChannel == '398099895569088513' || newUserChannel == '544059704570150912')) {

        channelUsers.push({
            connectionTime: Date.now(),
            id: newState.id,
        });

        let Data = new Date(),
        year = Data.getFullYear(),
        month = Data.getMonth(),
        day = Data.getDate(),
        hour = Data.getHours(),
        minutes = Data.getMinutes(),
        seconds = Data.getSeconds();

        textChannel.send(`[${year}/${month + 1}/${day}   ${hour}:${minutes}:${seconds}] ${userName} подключился`);

    // } else if ((newUserChannel == undefined || newUserChannel == '704233423794995312' || newUserChannel == '704233467012972564' || newUserChannel == '704233511145701497' || newUserChannel == '696666666628546662' || newUserChannel == '411951021536051202') && (oldUserChannel == '480807623525007361' || oldUserChannel == '398099895569088513' || oldUserChannel == '544059704570150912')) {
    } else if (oldRecVC && !newRecVC) {
        
        let nameAndTag = newState.member.user.tag;
        let regexp = /\d+/y;
        regexp.lastIndex = nameAndTag.indexOf('#') + 1;
        let userTag = regexp.exec(nameAndTag)[0];

        let Data = new Date(),
        year = Data.getFullYear(),
        month = Data.getMonth(),
        day = Data.getDate(),
        hour = Data.getHours(),
        minutes = Data.getMinutes(),
        seconds = Data.getSeconds();

        textChannel.send(`[${year}/${month + 1}/${day}   ${hour}:${minutes}:${seconds}] ${userName} отключился`);

        let currentUser = channelUsers.find(item => item.id == newState.id);

        currentUser.disconnectionTime = Date.now();
        timeInChannel = Math.trunc( (currentUser.disconnectionTime - currentUser.connectionTime)/1000 );

        textChannel.send(`Время, которое ${userName} провел в голосовом канале: ${timeInChannel}`);

        const connection = await mysql.createConnection(mysqlConfig);

        let response = await connection.execute(`SELECT * FROM time_online`);

        let tableTime = 0;

        if ( !response[0].find(item => item.id == newState.id) ) {
            try {
                if (month == 0) await connection.execute(`INSERT INTO time_online (id, name, tag, role, totalTime, time${month}, time${month + 11}) VALUES (${newState.id.toString()}, '${userName}', '${userTag}', '${userRole}', 0, 0, 0)`);
                else await connection.execute(`INSERT INTO time_online (id, name, tag, role, totalTime, time${month}, time${month - 1}) VALUES (${newState.id.toString()}, '${userName}', '${userTag}', '${userRole}', 0, 0, 0)`);
                response = await connection.execute(`SELECT * FROM time_online`);
            }
            catch (err) {
                if (month == 0 || month == 1) await connection.execute(`ALTER TABLE time_online DROP COLUMN time${month + 10}, ADD COLUMN time${month} BIGINT(255) DEFAULT 0`);
                else await connection.execute(`ALTER TABLE time_online DROP COLUMN time${month - 2}, ADD COLUMN time${month} BIGINT(255) DEFAULT 0`);
                if (month == 0) await connection.execute(`INSERT INTO time_online (id, name, tag, role, totalTime, time${month}, time${month + 11}) VALUES (${newState.id.toString()}, '${userName}', '${userTag}', '${userRole}', 0, 0, 0)`);
                else await connection.execute(`INSERT INTO time_online (id, name, tag, role, totalTime, time${month}, time${month - 1}) VALUES (${newState.id.toString()}, '${userName}', '${userTag}', '${userRole}', 0, 0, 0)`);
                response = await connection.execute(`SELECT * FROM time_online`);
            }
        }

        tableTime = response[0].find(item => item.id == newState.id)[`time${month}`]; 
        if (tableTime === undefined) {
            if (month == 0 || month == 1) await connection.execute(`ALTER TABLE time_online DROP COLUMN time${month + 10}, ADD COLUMN time${month} BIGINT(255) DEFAULT 0`);
            else await connection.execute(`ALTER TABLE time_online DROP COLUMN time${month - 2}, ADD COLUMN time${month} BIGINT(255) DEFAULT 0`);
            tableTime = 0;
        }
        let tableTotalTime = response[0].find(item => item.id == newState.id).totalTime; 
        let resultTime = timeInChannel + tableTime;
        let resultTotalTime = timeInChannel + tableTotalTime;
            
        await connection.execute(`UPDATE time_online SET name='${userName}', tag='${userTag}', role='${userRole}', totalTime=${resultTotalTime}, time${month}=${resultTime} WHERE id=${currentUser.id.toString()}`);
        
        let currentUserIndex = channelUsers.findIndex(item => item.id == newState.id);
        channelUsers.splice(currentUserIndex, 1);

        connection.end(); 
    }
       
	// let channell = await robot.channels.fetch('763672675759161388'); // голосовой
    // console.log('===================================================================================================\n');
});

robot.on('message', async message => {
    // let textChannel = await robot.channels.fetch('763672675759161387'); // текстовый
    let textVerChannel = await robot.channels.fetch('547032514976415755'); // верификация

    if (message.content === '/join') {
        let q = await robot.channels.fetch('544059704570150912');
        q.join();
    } else if (message.content === '/leave') {
        let q = await robot.channels.fetch('544059704570150912');
        q.leave();
    }

    if (message.author.id != '763434829517422652') {
        let thisVerUser = verificationUsers.find(item => item.userId == message.author.id);
        let textChannel;
        if (thisVerUser) {
            textChannel = await message.client.channels.fetch(thisVerUser.channel);
        }

        if (thisVerUser && thisVerUser.etap == 1 && message.content.match(/[а-яА-ЯЁё]/)) {
            thisVerUser.etap = 2;
            thisVerUser.name = message.content;
            textChannel.send('Сколько отроду лет тебе?```Ответом должно быть число```');
        }
        if (thisVerUser && thisVerUser.etap == 2 && message.content.match(/\d+/)) {
            thisVerUser.etap = 3;
            thisVerUser.age = message.content;
            textChannel.send('Откуда ты прибыл к нам?```Ответом должо быть название города, в котором ты проживаешь, написанное кириллицой```');

        }
        if (thisVerUser && thisVerUser.etap == 3 && message.content.match(/[а-яА-ЯЁё]/)) {
            thisVerUser.etap = 4;
            thisVerUser.city = message.content;
            textChannel.send('Почту нам тоже надобно знать...```Ответом должен быть e-mail. Например: dobrinya@mail.ru```');

        }
        if (thisVerUser && thisVerUser.etap == 4 && message.content.match(/@/)) {
            thisVerUser.etap = 5;
            thisVerUser.mail = message.content;
            textChannel.send('У тебя есть желание командовать ястребами?```Да/нет```');
            
        }
        if (thisVerUser && thisVerUser.etap == 6 && (message.content.match(/\w+/) || message.content.match(/[а-яА-ЯЁё]/))) {
            thisVerUser.etap = 7;
            thisVerUser.invite = message.content;
            textChannel.send('У всех богатырей есть Steam, а у тебя?```Ответом должна быть ссылка на твой профиль в стиме```');

        }
        if (thisVerUser && thisVerUser.etap == 5 && (message.content.match(/да/i) || message.content.match(/нет/i))) {
            thisVerUser.etap = 6;
            thisVerUser.command = message.content;
            textChannel.send('Кто предложил тебе присоединиться к нам?```Ответом может быть имя человека, позвавшего тебя в клан, или нвазвание ресурса, с которого ты пришел```');

        }
        if (thisVerUser && thisVerUser.etap == 7 && message.content.match(/steamcommunity.com/)) {
            thisVerUser.steam = message.content;
            textChannel.send(`Я передам старейшинам о твоем прибытии в Hawkband. Принятие решения о твоем зачислении в братство Ястреба может занять некоторое время. Спасибо за ответы, ${thisVerUser.name}.`);
            const exampleEmb = new Discord.MessageEmbed()
                .setColor('#75c482')
                .setTitle(':envelope_with_arrow: Новая заявка на верификацию :eagle:')
                .setFooter('Hawkband Clan')
                .addFields(
                    {name: ' :pencil: Имя:', value: thisVerUser.name}, 
                    {name: ' :underage: Возраст:', value: thisVerUser.age},
                    {name: ' :cityscape: Город проживания:', value: thisVerUser.city},
                    {name: ' :video_game: Discord:', value: `${message.author.tag} <@${thisVerUser.userId}>`},
                    {name: ' :e_mail: E-mail:', value: thisVerUser.mail},
                    {name: ' :triangular_flag_on_post: Хочет ли командовать:', value: thisVerUser.command},
                    {name: ' :desktop: Steam:', value: thisVerUser.steam})
                .setThumbnail(message.author.avatarURL()).setTimestamp();
            let embMsg = await textVerChannel.send(exampleEmb);
            embMsg.react('✅');
            embMsg.react('❌');
            
        }
    }
});
    
robot.on('messageReactionAdd', async (reaction, user) => {
    // let textChannel = await robot.channels.fetch('763672675759161387'); // текстовый
    let thisGuild = await robot.guilds.fetch('394055433641263105');

    if (user.bot) return;
    let textChannelAdm = await robot.channels.fetch('547032514976415755'); // верификация   
    let thisVerUser = verificationUsers.find(item => item.userId == user.id);
    let textChannel;
    if (thisVerUser) {
        textChannel = await reaction.client.channels.fetch(thisVerUser.channel);
    }

    if (reaction.emoji.name == '✅' && reaction.message.channel.id == '547032514976415755') {
        try {
            let t = reaction.message.embeds[0].fields.find(item => item.name == ':e_mail: E-mail:');
            let thisUserIndex = verificationUsers.findIndex(item => item.mail == t.value);
            let thisVerUser = verificationUsers.find(item => item.mail == t.value);
            // let thisGuild = await robot.guilds.fetch('394055433641263105');
            
            let us = await thisGuild.members.fetch(verificationUsers[thisUserIndex].userId);
            us.send("Поздравляю, верификация пройдена! Вся необходимая информация и правила есть на канале \"Добро пожаловать\":\nhttps://discord.com/channels/394055433641263105/412643124830142468/706165211714945035\nОзнакомься с ними, если ты этого еще не сделал. Если у тебя остались какие-либо вопросы, обратись к братьям по оружию.");
            
            let firesideChannel = await robot.channels.fetch('702042182327992350'); // очаг, но пока что тестовый
            let phrases = [
                `<@&685131993955958838> <@&685131994069598227>\nЭй вы, воины грозные, спешить во все концы! Несите весточку радостную: быть в лагере нашем пиру богатому в честь прибытия ястреба нового, имя которому <@${thisVerUser.userId}> :eagle:`,
                `<@&685131993955958838> <@&685131994069598227>\nИ был пир на весь мир за воина ратного <@${thisVerUser.userId}>, что в братсво Ястреба вступил... Люду доброму на радость, да злым врагам на зависть! И я там был, мед-пиво пил, по усам текло, да в рот не попало! :eagle:`,
                `<@&685131993955958838> <@&685131994069598227>\nОткупоривай бочки с пивом-медом да наливай поскорей до краев, не жалей! Праздник у нас сегодня знатный будет... Поднимем же кубки за воина новобранного, имя которому <@${thisVerUser.userId}> :eagle:`,
                `<@&685131993955958838> <@&685131994069598227>\nЖгите костры сигнальные, шлите весточку братьям на дальних рубежах, чтобы ехали на пир славный в честь прибытия воина великого , звать которого <@${thisVerUser.userId}>. Поприветствуем его братья словом добрым, да кубком полным хмельной медовухи. Улыбнется же Ястреб нам, да загрустит враг от того, насколько велико бравое воинство Hawkband :eagle:`,
                `<@&685131993955958838> <@&685131994069598227>\nСегодня солнце теплее, лица добрее, медовуха вкуснее. Ястребы кружат над головами суровых бойцов - знак это добрый без спору. Закатывай пир! С новым братом, чье имя <@${thisVerUser.userId}>, обязательно мы победим! :eagle:`,
                `<@&685131993955958838> <@&685131994069598227>\nРазошлите весть добрую по лагерю нашему: прибыл к нам новый боец, имя которому <@${thisVerUser.userId}>. Ястреб, будь вежлив с новым братом по оружию, подними кубок эля за здоровье и удачу его! :eagle:`,
                `<@&685131993955958838> <@&685131994069598227>\nСлавься воинство Ястреба, звонарь же бей в колокола, да будут залиты медовухой кубки. Отныне пополнятся знамена наши, ибо воин бравый <@${thisVerUser.userId}> примкнул к нам. Да прибудет с тобой Ястреб :eagle:`,
                `<@&685131993955958838> <@&685131994069598227>\nА и сильные, могучие воины в славном братсве Ястреба! Не скакать врагам по нашей земле! Не топтать их коням землю нашу родную! Не затмить им солнце наше красное! Поприветствуем же брата нового, имя которому <@${thisVerUser.userId}>, что горой станет в стене щитов наших, что дуб столентний вырвет с корнем, если тот путь преграждать будет! :eagle:`,
                `<@&685131993955958838> <@&685131994069598227>\nВек стоит лагерь наш - не шатается! И века простоит - не шелохнется! <@${thisVerUser.userId}>, за тебя, воин славный, мы кубки до краев полные поднимаем! Не подводи братьев-ястребов! :eagle:`,
                `<@&685131993955958838> <@&685131994069598227>\nСегодня день благодатный, ибо стал под наши знамена воин знатный <@${thisVerUser.userId}>. На бой, ястребы! Разобьем врагов полчище несметное! Слава да почет ждут нас не только в нашем народе, но и в других странах заморских! :eagle:`,
            ];
            let randomIndex = Math.trunc(Math.random() * 10);

            let msg = await firesideChannel.send(phrases[randomIndex]);
            let emoji1 = thisGuild.emojis.cache.find(item => item.name == 'Drink');
            let emoji2 = thisGuild.emojis.cache.find(item => item.name == 'notwar');
            msg.react('🦅');
            msg.react(emoji1);
            msg.react(emoji2); 

            await us.roles.remove('685130173670096907');
            await us.roles.add('685130173154066480');
            await us.roles.add('767732406235955221');
            await us.roles.add('685131994069598227');
            await us.setNickname(`ᛩ ${us.user.username}`);

            let fordelete = await robot.channels.fetch(verificationUsers[thisUserIndex].channel);
            await fordelete.delete();

            verificationUsers.splice(thisUserIndex, 1);
            let r = reaction.message.reactions.cache.find(item => item.emoji.name == '❌');
            await r.remove();
            textChannelAdm.send(`Заявка была одобрена пользователем ${user.username}\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${reaction.message.id}`);
            
        } catch (err) {
            if (err.name == 'TypeError' && err.message == 'Cannot read property \'userId\' of undefined') textChannelAdm.send(`<@${user.id}>, заявка уже была одобрена!`);
            else console.log(err);

        }

    } else if (reaction.emoji.name == '❌' && reaction.message.channel.id == '547032514976415755') { 
        try {
            let t = reaction.message.embeds[0].fields.find(item => item.name == ':e_mail: E-mail:')
            let thisUserIndex = verificationUsers.findIndex(item => item.mail == t.value);
            let thisGuild = await robot.guilds.fetch('394055433641263105');

            let us = await thisGuild.members.fetch(verificationUsers[thisUserIndex].userId);
            us.send("Твоя заявка на верификацию была отклонена старейшинами. Возможно, ты не соответствуешь требованием нашего сообщества.");
            
            let fordelete = await robot.channels.fetch(verificationUsers[thisUserIndex].channel);
            await fordelete.delete();
            
            await (await thisGuild.members.fetch(verificationUsers[thisUserIndex].userId)).kick();

            verificationUsers.splice(thisUserIndex, 1);
            let r = reaction.message.reactions.cache.find(item => item.emoji.name == '✅');
            await r.remove();
            textChannelAdm.send(`Заявка была отклонена пользователем ${user.username}`);
        } catch (err) {
            if (err.name == 'TypeError' && err.message == 'Cannot read property \'userId\' of undefined') textChannelAdm.send(`<@${user.id}>, заявка уже была отклонена`);
            else console.log(err);

        }//&& thisGuild.member(user).roles.cache.find(item => item.id == '685130173670096907')

    } else if (reaction.emoji.name == '✅' && thisVerUser !== undefined && reaction.message.channel.id == thisVerUser.channel) { // добавить проверку на ид канала
        textChannel.send('Отлично! Тогда начнем. Как звать тебя, путник?\n```Ответом должно быть твое настоящее имя, написанное кириллицой```'); 
        thisVerUser.etap = 1;
        // verificationUsers.push({
        //     userId: user.id,
        //     etap: 1,
        //     channel: reaction.message.channel.id,
        // });
        let r = reaction.message.reactions.cache.find(item => item.emoji.name == '✅'); //reaction.emoji
        await r.remove();
        reaction.message.react('✅');
        
    } else if (reaction.emoji.name == '❌' && thisVerUser !== undefined && reaction.message.channel.id == thisVerUser.channel) { // добавить проверку на ид канала
        textChannel.send('Что ж, дело твое. В таком случае ты остаешься новобранцем с рядом запретов в нашем лагере. Если передумаешь, дай знать.```Если захочешь начать процесс верификации, то нажми на галочку```');
        let thisUserIndex = verificationUsers.findIndex(item => item.userId == user.id);
        let r = reaction.message.reactions.cache.find(item => item.emoji.name == '❌'); //reaction.emoji
        await r.remove();
        reaction.message.react('❌');
        if (thisUserIndex == -1) return;
        verificationUsers.splice(thisUserIndex, 1);

    } 

    // games

    if (reaction.message.channel == '767326891291049994') {
        
        await thisGuild.member(user).roles.add('775333808308224020');

        switch (reaction.emoji.name) {
            case '🏇':
                await thisGuild.member(user).roles.add('775651605721907200');
            break;
            case '🤺':
                await thisGuild.member(user).roles.add('775647785558474753');
            break;
            case '🗽':
                await thisGuild.member(user).roles.add('775651543680548875');
            break;
            case '🛬':
                await thisGuild.member(user).roles.add('775651344286482442');
            break;
            case '🌴':
                await thisGuild.member(user).roles.add('775408949288632372');
            break;
            case '🔩':
                await thisGuild.member(user).roles.add('775334053071028256');
            break;
            case '🥨':
                await thisGuild.member(user).roles.add('775394005323481108');
            break;
        }
    }

});

robot.on('messageReactionRemove', async (reaction, user) => {

    if (reaction.message.channel == '767326891291049994') {
        let thisGuild = await robot.guilds.fetch('394055433641263105');

        switch (reaction.emoji.name) {
            case '🏇':
                await thisGuild.member(user).roles.remove('775651605721907200');
            break;
            case '🤺':
                await thisGuild.member(user).roles.remove('775647785558474753');
            break;
            case '🗽':
                await thisGuild.member(user).roles.remove('775651543680548875');
            break;
            case '🛬':
                await thisGuild.member(user).roles.remove('775651344286482442');
            break;
            case '🌴':
                await thisGuild.member(user).roles.remove('775408949288632372');
            break;
            case '🔩':
                await thisGuild.member(user).roles.remove('775334053071028256');
            break;
            case '🥨':
                await thisGuild.member(user).roles.remove('775394005323481108');
            break;
        }
    }

});

robot.on('message', (msg) => { // Реагирование на сообщения
    if (msg.author.username != robot.user.username && msg.author.discriminator != robot.user.discriminator) {
    var comm = msg.content.trim() + " ";
    var comm_name = comm.slice(0, comm.indexOf(" "));
    var messArr = comm.split(" ");
    for (comm_count in comms.comms) {
        var comm2 = prefix + comms.comms[comm_count].name;
    if (comm2 == comm_name) {
        comms.comms[comm_count].out(robot, msg, messArr);
        }
    }
    }
});

robot.login(token);