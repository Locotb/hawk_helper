async function createVerification(member, verificationUsers) {

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

    await member.roles.add('685130173670096907');
    let thisGuild = member.guild;
    let fortext = await thisGuild.channels.create(`❗${member.user.username} верификация`, {type: 'GUILD_TEXT', parent: parent, permissionOverwrites: permissions});

    // let msg = await fortext.send(`<@${member.id}>\nПриветствую тебя, путник. Меня зовут Добрыня, я помогу тебе освоиться здесь. Для начала мне нужно собрать о тебе некоторую информацию и донести ее до самых почетных и уважаемых членов нашего братства. Дай знать, если ты согласен\n\`\`\`1) Нажми на галочку, если хочешь начать процесс верификации\n2) Нажми на крестик, если ты не хочешь начинать процесс верификации или если хочешь его отменить\n3) Нажми на корабль, если ты являешься представителем другого клана\`\`\``);
    // Добавить про послов ↑
    // await msg.react('✅');
    // await msg.react('❌');
    // await msg.react(msg.guild.emojis.cache.get('620724518305923103'));
   
    const { MessageActionRow, MessageButton } = require('discord.js');

	let btns = [];

    btns.push(new MessageButton()
        .setCustomId(`first`)
        .setLabel('✅')
        .setStyle('SUCCESS'));

    btns.push(new MessageButton()
        .setCustomId(`second`)
        .setLabel('📜')
        .setStyle('SECONDARY'));
    
    const row = new MessageActionRow().addComponents(btns[0], btns[1]);
    
    let content = `<@${member.id}>\nПриветствую тебя, путник. Меня зовут Добрыня, я помогу тебе освоиться здесь. Для начала мне нужно собрать о тебе некоторую информацию и донести ее до самых почетных и уважаемых членов нашего братства. Дай знать, если ты согласен\n\`\`\`1) Нажми на галочку, если хочешь начать процесс верификации\n2) Нажми на крестик, если ты не хочешь начинать процесс верификации или если хочешь его отменить\n3) Нажми на корабль, если ты являешься представителем другого клана\`\`\``;
    let msg = await fortext.send({ content: content, components: [row] });


    verificationUsers.push({
        userId: member.user.id,
        phase: 0,
        channel: fortext.id,
    });

}

async function analyseChoice(reaction, user, verificationUsers) {
    let thisVerUser = verificationUsers.find(item => item.userId === user.id);
    if (!thisVerUser) return; // !!

    if (reaction.emoji.name === '✅' && reaction.message.channelId === thisVerUser.channel) {
        await reaction.message.channel.send('Отлично! Тогда начнем. Как звать тебя, путник?\n```Ответом должно быть твое настоящее имя, написанное кириллицей```'); 
        thisVerUser.phase = 1;
        await reaction.message.reactions.cache.find(item => item.emoji.name === '✅').remove();
        await reaction.message.react('✅');
    } 
    else if (reaction.emoji.name === '❌' && reaction.message.channelId === thisVerUser.channel) {
        await reaction.message.channel.send('Что ж, дело твое. В таком случае ты остаешься новобранцем с рядом запретов в нашем лагере. Если передумаешь, дай знать.\n```Если захочешь начать процесс верификации, то нажми на галочку под первым сообщением в этом канале ↑```');
        thisVerUser.phase = 0;
        await reaction.message.reactions.cache.find(item => item.emoji.name === '❌').remove();
        await reaction.message.react('❌');
    }
    else if (reaction.emoji.id === '620724518305923103') {
        await reaction.message.guild.members.cache.get(user.id).roles.add('411968125869752340');
        await reaction.message.guild.members.cache.get(user.id).roles.remove('685130173670096907');
        await reaction.message.channel.delete();
        let thisUserIndex = verificationUsers.findIndex(item => item.userId === user.id);
        verificationUsers.splice(thisUserIndex, 1);

        const sendPM = require('./sendPM.js');
        let msg = `Тебе была выдана роль Ambassador. Теперь у тебя есть доступ к каналу Очаг и Оружейная. 
        Первый для общения, а второй для торговли/обмена/бескорыстной передачи предметов/войск/ресурсов и т.д. 
        **Если ты хотел вступить в клан, то перезайди на сервер и еще раз внимательно прочитай инструкции бота**`;
        await sendPM(msg, user, reaction.message.guild, 'о выдачи роли посла');



        // try {
        //    await user.send('Тебе была выдана роль Ambassador. Теперь у тебя есть доступ к каналу Очаг и Оружейная. Первый для общения, а второй для торговли/обмена/бескорыстной передачи предметов/войск/ресурсов и т.д. **Если ты хотел вступить в клан, то перезайди на сервер и еще раз внимательно прочитай инструкции бота**');
        //    // !! англ. версия, выделить жирным с "если ты хотел", отдельная ссылка-приглашение именно для этого сообщения, 
        // } catch (err) {
        //     console.log(`[${new Date().toLocaleString('ru')}] Ошибка при отправке сообщения о выдачи роли посла\n`, err); 
        //     console.log('===================================================================================================\n');
        //     let textChannel = await reaction.message.guild.channels.fetch('767326891291049994'); // мб поменять на ставку?
        //     await textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение пользователю <@${verUser.id}>, ${verUser.user.tag}`);
        // }



        // выдать роль посла, удалить канал, мб написать в лс verificationUsers.remove remove роли новобранца
    
    }
}

async function manageDialog(message, verificationUsers) {
    let thisVerUser = verificationUsers.find(item => item.userId === message.author.id);
    if (!thisVerUser) return; // !!

    // if (thisVerUser && message.channel.id === thisVerUser.channel && thisVerUser.phase === 1 && message.content.match(/[а-яА-ЯЁё]/)) {
    if (message.channelId === thisVerUser.channel && thisVerUser.phase === 1 && message.content.match(/[а-яА-ЯЁё]/)) {
        thisVerUser.phase = 2;
        thisVerUser.name = message.content;
        message.channel.send('Сколько отроду лет тебе?\n```Ответом должно быть число```');
    }
    // else if (thisVerUser && message.channel.id === thisVerUser.channel && thisVerUser.phase === 2 && message.content.match(/\d+/)) {
    else if (message.channelId === thisVerUser.channel && thisVerUser.phase === 2 && message.content.match(/\d+/)) {
        thisVerUser.phase = 3;
        thisVerUser.age = message.content;
        message.channel.send('У тебя есть желание командовать ястребами?\n```Да/нет```');    
    }
    // else if (thisVerUser && message.channel.id === thisVerUser.channel && thisVerUser.phase === 3 && (message.content.match(/да/i) || message.content.match(/нет/i))) {
    else if (message.channelId === thisVerUser.channel && thisVerUser.phase === 3 && (message.content.match(/да/i) || message.content.match(/нет/i))) {
        thisVerUser.phase = 4;
        thisVerUser.command = message.content;
        message.channel.send('Кто предложил тебе присоединиться к нам?\n```Ответом может быть имя человека, позвавшего тебя в клан, или название ресурса, с которого ты пришел```');
    }
    // else if (thisVerUser && message.channel.id === thisVerUser.channel && thisVerUser.phase === 4) {
    else if (message.channelId === thisVerUser.channel && thisVerUser.phase === 4) {
        thisVerUser.phase = 5;
        thisVerUser.invite = message.content;
        message.channel.send('У всех богатырей есть Steam, а у тебя?\n```Ответом должна быть ссылка на твой профиль в стиме```');
    }
    // else if (thisVerUser && message.channel.id === thisVerUser.channel && thisVerUser.phase === 5 && message.content.match(/steamcommunity.com/)) {
    else if (message.channelId === thisVerUser.channel && thisVerUser.phase === 5 && message.content.match(/steamcommunity.com/)) {
        thisVerUser.steam = message.content;
        thisVerUser.phase = 6;
        message.channel.send(`Я передам старейшинам о твоем прибытии в Hawkband. Принятие решения о твоем зачислении в братство Ястреба может занять некоторое время. Спасибо за ответы, ${thisVerUser.name}.`);
        const { MessageEmbed } = require('discord.js');
        const verificationForm = new MessageEmbed()
            .setColor('#75c482')
            .setTitle(':envelope_with_arrow: Новая заявка на верификацию :eagle:')
            .setFooter('Hawkband Clan')
            .addFields(
                {name: ' :pencil: Имя:', value: thisVerUser.name}, 
                {name: ' :underage: Возраст:', value: thisVerUser.age},
                {name: ' :video_game: Discord:', value: `${message.author.tag} <@${thisVerUser.userId}>`},
                {name: ' :triangular_flag_on_post: Хочет ли командовать:', value: thisVerUser.command},
                {name: ' :information_source: Кто пригласил/откуда узнал:', value: thisVerUser.invite}, 
                {name: ' :desktop: Steam:', value: thisVerUser.steam},
                {name: ' :id: id:', value: `${message.author.id}`})
            .setThumbnail(message.author.avatarURL()).setTimestamp();
        let textVerChannel = await message.guild.channels.fetch('767326891291049994'); // !!
        let embMsg = await textVerChannel.send({ embeds: [verificationForm] });
        await embMsg.react('✅');
        await embMsg.react('❌');  
    }
}

async function analyseDecision(reaction, user, verificationUsers) {

    // let thisGuild = await robot.guilds.fetch('394055433641263105'); 
    let thisGuild = reaction.message.guild; 

    let idField = reaction.message.embeds[0].fields.find(item => item.name === ':id: id:');
    let thisUserIndex = verificationUsers.findIndex(item => item.userId === idField.value);
    const sendPM = require('./sendPM.js');

    //if (!~thisUserIndex) return;
    if (thisUserIndex === -1) return;

    if (reaction.emoji.name === '✅') { 
        let verUser = await thisGuild.members.fetch(verificationUsers[thisUserIndex].userId); // !! verUser на verMember
        let firesideChannel = await reaction.message.guild.channels.fetch('767326891291049994'); // id !! fireside устарело, дать переменной универсальное имя
        let phrases = [
            `<@&685131993955958838> <@&685131994069598227>\nЭй вы, воины грозные, спешить во все концы! Несите весточку радостную: быть в лагере нашем пиру богатому в честь прибытия ястреба нового, имя которому <@${verUser.id}> :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nИ был пир на весь мир за воина ратного <@${verUser.id}>, что в братсво Ястреба вступил... Люду доброму на радость, да злым врагам на зависть! И я там был, мед-пиво пил, по усам текло, да в рот не попало! :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nОткупоривай бочки с пивом-медом да наливай поскорей до краев, не жалей! Праздник у нас сегодня знатный будет... Поднимем же кубки за воина новобранного, имя которому <@${verUser.id}> :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nЖгите костры сигнальные, шлите весточку братьям на дальних рубежах, чтобы ехали на пир славный в честь прибытия воина великого, звать которого <@${verUser.id}>. Поприветствуем его, братья, словом добрым, да кубком полным хмельной медовухи. Улыбнется же Ястреб нам, да загрустит враг от того, насколько велико бравое воинство Hawkband :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nСегодня солнце теплее, лица добрее, медовуха вкуснее. Ястребы кружат над головами суровых бойцов - знак это добрый без спору. Закатывай пир! С новым братом, чье имя <@${verUser.id}>, обязательно мы победим! :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nРазошлите весть добрую по лагерю нашему: прибыл к нам новый боец, имя которому <@${verUser.id}>. Ястреб, будь вежлив с новым братом по оружию, подними кубок эля за здоровье и удачу его! :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nСлавься воинство Ястреба, звонарь же бей в колокола, да будут залиты медовухой кубки. Отныне пополнятся знамена наши, ибо воин бравый <@${verUser.id}> примкнул к нам. Да прибудет с тобой Ястреб :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nА и сильные, могучие воины в славном братсве Ястреба! Не скакать врагам по нашей земле! Не топтать их коням землю нашу родную! Не затмить им солнце наше красное! Поприветствуем же брата нового, имя которому <@${verUser.id}>, что горой станет в стене щитов наших, что дуб столентний с корнем вырвет, если тот путь преграждать будет! :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nВек стоит лагерь наш - не шатается! И века простоит - не шелохнется! <@${verUser.id}>, за тебя, воин славный, мы кубки до краев полные поднимаем! Не подводи братьев-ястребов! :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nСегодня день благодатный, ибо стал под наши знамена воин знатный <@${verUser.id}>. На бой, ястребы! Разобьем врагов полчище несметное! Слава да почет ждут нас не только в нашем народе, но и в других странах заморских! :eagle:`,
        ];
        let randomIndex = Math.trunc(Math.random() * 10); // можно заменить на навороченную формулу
        let msg = await firesideChannel.send(phrases[randomIndex]);
        let emoji1 = thisGuild.emojis.cache.get('620732643406774282');
        let emoji2 = thisGuild.emojis.cache.get('620724518717227009');
        await msg.react('🦅');
        await msg.react(emoji1);
        await msg.react(emoji2); 
        await verUser.roles.add(['685130173154066480', '767732406235955221', '685131994069598227']);
        await verUser.roles.remove('685130173670096907');
        verUser.setNickname(`ᛩ ${verUser.user.username}`); // проверка на длину ника
        let forDelete = await reaction.message.guild.channels.fetch(verificationUsers[thisUserIndex].channel);
        await forDelete.delete();
        await reaction.message.reactions.cache.find(item => item.emoji.name === '❌').remove();
        await reaction.message.channel.send(`Заявка была одобрена пользователем ${user.username}\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${reaction.message.id}`);
        
        
        
        let msg1 = `Поздравляю, верификация пройдена! Вся необходимая информация и правила есть на канале "Welcome": 
        \nhttps://discord.com/channels/394055433641263105/412643124830142468/706165211714945035\n
        Ознакомься с ними, если ты этого еще не сделал. Если у тебя остались какие-либо вопросы, обратись к братьям по оружию.`; // переменная msg уже была создана выше
        
        await sendPM(msg1, verUser.user, reaction.message.guild, 'об одобрении заявки на верификацию');

        // try {
        //     await verUser.send("Поздравляю, верификация пройдена! Вся необходимая информация и правила есть на канале \"Добро пожаловать\":\nhttps://discord.com/channels/394055433641263105/412643124830142468/706165211714945035 \nОзнакомься с ними, если ты этого еще не сделал. Если у тебя остались какие-либо вопросы, обратись к братьям по оружию.");
        // } catch (err) {
        //     console.log(`[${new Date().toLocaleString('ru')}] Ошибка при отправке сообщения об одобрении заявки на верификацию\n`, err); 
        //     console.log('===================================================================================================\n');
        //     let textChannel = await reaction.message.guild.channels.fetch('411948808457682954'); // мб поменять на ставку? поменял
        //     await textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение пользователю <@${verUser.id}>, ${verUser.user.tag}`);
        // }
        
        
        
        verificationUsers.splice(thisUserIndex, 1);
    }
    else if (reaction.emoji.name === '❌') { 
        let verUser = await thisGuild.members.fetch(verificationUsers[thisUserIndex].userId); // !! verUser на verMember            
        let forDelete = await reaction.message.guild.channels.fetch(verificationUsers[thisUserIndex].channel);
        await forDelete.delete();
        reaction.message.reactions.cache.find(item => item.emoji.name === '✅').remove();
        await reaction.message.channel.send(`Заявка была отклонена пользователем ${user.username}\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${reaction.message.id}`);
        
        
        
        let msg = `Твоя заявка на верификацию была отклонена старейшинами. Возможно, ты не соответствуешь требованием нашего сообщества`;
        await sendPM(msg, verUser.user, reaction.message.guild, 'об отказе заявки на верификацию');

        
        // try {
        //     await verUser.send("Твоя заявка на верификацию была отклонена старейшинами. Возможно, ты не соответствуешь требованием нашего сообщества.");
        // } catch (err) {
        //     console.log(`[${new Date().toLocaleString('ru')}] Ошибка при отправке сообщения об отказе заявки на верификацию\n`, err); 
        //     console.log('===================================================================================================\n');
        //     let textChannel = await reaction.message.guild.channels.fetch('767326891291049994');
        //     await textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение пользователю <@${verUser.id}>, ${verUser.tag}`);
        // }




        await verUser.kick();
        verificationUsers.splice(thisUserIndex, 1);
    }
}

module.exports = {
    createVerification: createVerification,
    manageDialog: manageDialog,
    analyseChoice: analyseChoice,
    analyseDecision: analyseDecision,
};