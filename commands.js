const { MessageEmbed } = require('discord.js');
const mysql = require('mysql2/promise');
const { mysqlConfig } = require('./config.json');
const updateDB = require('./channelsListening.js').updateDB;
const sendPM = require('./sendPM.js');

async function data(interaction) {

    if (interaction.channelId !== '772379655113408512' && interaction.channelId !== '767326891291049994') {
        interaction.reply({ content: 'Эту команду можно использовать только в <#772379655113408512>', ephemeral: true });
        return;
    }

    const dataForm = new MessageEmbed()
        .setColor(interaction.member.roles.color.color)
        .setTitle(':bar_chart: Онлайн ястребов')
        .setFooter('Hawkband Clan');

    const connection = await mysql.createConnection(mysqlConfig);
    let response = await connection.execute(`SELECT * FROM time_online_test WHERE id=${interaction.member.id}`);

    if (!response[0][0]) {
        await interaction.reply("На данный момент в базе данных нет информации о тебе");
        return;
    }

    let DBLastMonth = +response[1][6].name.match(/\d+/)[0];
    await updateDB(DBLastMonth, response, connection);
    
    let month = new Date().getMonth();
    response = await connection.execute(`SELECT time${month}, totalTime FROM time_online_test WHERE id=${interaction.member.id}`);
    let curMonthTime = response[0][0][`time${month}`];
    let totalTime = response[0][0].totalTime;
    dataForm.addFields(
        {name: ' :eagle: Твое время на службе в этом месяце:', value: `:clock4: ${(curMonthTime/3600).toFixed(2)} часов(-а)`}, 
        {name: ' :eagle: За все время ты отслужил:', value: `:clock4: ${(totalTime/3600).toFixed(2)} часов(-а)`} 
    ).setThumbnail(interaction.user.avatarURL()).setTimestamp();

    // if (interaction.options.getBoolean('private')) {
    if (interaction.options.getSubcommand() === 'private') {
        // await interaction.reply({ embeds: [dataForm], ephemeral: true });

        await interaction.user.send({ embeds: [dataForm] });
        await interaction.reply("Я выслал статистику тебе в лс");    
    } else {
        await interaction.reply({ embeds: [dataForm] });
    }

        
    // interaction.reply("что-то пошло не так. Пожалуйста, сообщи об этом разработчику <@318010463948374017>");
    // console.log(err);
        

    await connection.end(); 
}

async function notice(interaction) {
    if (interaction.channelId !== '411948808457682954' && interaction.channelId !== '913463329874399312' && interaction.channelId !== '767326891291049994') { // !! в каких каналах должна быть доступна команда?
        interaction.reply({ content: 'Эту команду можно использовать только в <#411948808457682954> или <#913463329874399312>', ephemeral: true });
        return;
    }

    let role = interaction.options.getRole('роль');

    let msg = interaction.options.getString('текст');
    role.members.forEach(async (member) => await sendPM(msg, member.user, interaction.guild, 'оповещения'));
    await interaction.reply(`Рассылка оповещений для ${role} завершена. Текст оповещения:\n\n${msg}`);
    
}

async function createListenedChannel(interaction, listenedChannelsIds) {
    if (interaction.channelId !== '411948808457682954' && interaction.channelId !== '913463329874399312' && interaction.channelId !== '767326891291049994') { // !! в каких каналах должна быть доступна команда?
        interaction.reply({ content: 'Эту команду можно использовать только в <#411948808457682954> или <#913463329874399312>', ephemeral: true });
        return;
    }

    let channelName = interaction.options.getString('название');

    let parentCategory = await interaction.guild.channels.fetch('760067839985451029');

    // !! привязка прав к роли "круг ..."
    let permissions = [
        {
            id: '685131994069598227', // круг воинов
            allow: ['VIEW_CHANNEL'],
        },
        {
            id: '685131993955958838', // круг командиров
            allow: ['VIEW_CHANNEL'],
        },
        {
            id: '685131993549373448', // круг старейшин
            allow: ['VIEW_CHANNEL'],
        },
        {
            id: interaction.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
        },
    ];

    // !! обдумать идею клонирования канала
    let listenedChannel = await interaction.guild.channels.create(`🔊 Зал ${channelName}`, {
        type: 'GUILD_VOICE', parent: parentCategory, permissionOverwrites: permissions, userLimit: 30
    });

    listenedChannelsIds.push(listenedChannel.id);

    const connection = await mysql.createConnection(mysqlConfig);
    await connection.execute(`INSERT INTO \`listened_channels\`(\`№\`, \`channelId\`) VALUES (DEFAULT, ${listenedChannel.id})`);
    await connection.end();

    await interaction.reply(`Создан голосовой канал <#${listenedChannel.id}>`);

}

module.exports = {
    data: data,
    notice: notice,
    createListenedChannel: createListenedChannel,
};