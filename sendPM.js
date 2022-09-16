async function sendPM(msg, user, guild, situation) { // мб вместо гильдии сразу канал передавать?
    try {
        await user.send(msg);
    } catch (err) {
        let textChannel = await guild.channels.fetch('411948808457682954'); // ставка

        console.log(`[${new Date().toLocaleString('ru')}] Ошибка при отправке сообщения ${situation}\n\n`, err); // мб добавить ид?
        console.log('===================================================================================================\n');
        await textChannel.send(`<@318010463948374017>\nНе удалось отправить сообщение ${situation} пользователю <@${user.id}>, ${user.tag}`); // мб добавить сюда тоже situation и ид?
    }
}

module.exports = sendPM;