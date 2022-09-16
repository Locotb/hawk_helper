// async function f3() {
//     if (eventSettings.isEventNow && newState.member.roles.cache.find(item => item.id === '786495891926024192') ) {
//         const connection = await mysql.createConnection(mysqlConfig);
//         let response = await connection.execute('SELECT \`voiceChannels\` FROM event_settings'); // SELECT voiceChannels FROM event_settings
//         let eventChannels = response[0][0].voiceChannels.split(', ');
//         let oldEventVC = eventChannels.find(channel => channel === oldState.channelID);
//         let newEventVC = eventChannels.find(channel => channel === newState.channelID);
//         if (oldEventVC && !newEventVC)
//         await connection.end();
//     }
// }

// function f4() {
//     if (oldEventVC && !newEventVC) {
//         let response = await connection.execute(`SELECT * FROM participants`);
//         if ( !response[0].find(item => item.id === newState.id) ) {
//             await connection.execute(`INSERT INTO participants (id, name, time) VALUES ('${newState.id}', '${newState.member.user.username}', 0)`);
//             response = await connection.execute(`SELECT * FROM participants`);
//         }
//         let tableTime = response[0].find(item => item.id === newState.id).time;
//         let resultTime = tableTime + timeInChannel;
//         await connection.execute(`UPDATE participants SET name='${newState.member.user.username}', time=${resultTime} WHERE id=${currentUser.id}`);
//     }
// }

async function f1(channelUsers, newState) {

    channelUsers.push({
        id: newState.id,
        connectionTime: Date.now(),
    });

    let textChannel = await newState.guild.channels.fetch('767326891291049994'); // текстовый с логами (заменен на тестовый)
    await textChannel.send(`[${new Date().toLocaleString('ru')}] ${newState.member.user.username} подключился`);
}
    
async function f2(channelUsers, userRole, newState, event, mysql, mysqlConfig) {

    let currentUser = channelUsers.find(item => item.id === newState.id); // !! мб нужна проверка?

    currentUser.disconnectionTime = Date.now();
    let timeInChannel = Math.trunc( (currentUser.disconnectionTime - currentUser.connectionTime)/1000 );

    let textChannel = await newState.guild.channels.fetch('767326891291049994'); // текстовый с логами (заменен на тестовый)
    let userName = newState.member.user.username;
    await textChannel.send(`[${new Date().toLocaleString('ru')}] ${userName} отключился`);
    await textChannel.send(`Время, которое ${userName} провел в голосовом канале: ${timeInChannel}`);

    const connection = await mysql.createConnection(mysqlConfig);

    let response = await connection.execute(`SELECT * FROM time_online_test WHERE id=${newState.id}`);
    let DBLastMonth = +response[1][6].name.match(/\d+/)[0];
    await updateDB(DBLastMonth, response, connection);

    let month = new Date().getMonth();
    response = await connection.execute(`SELECT * FROM time_online_test WHERE id=${newState.id}`);
    let userData = response[0][0];

    let userTag = newState.member.user.discriminator;

    if (!userData) {
        await connection.execute(`INSERT INTO time_online_test (id, name, tag, role, totalTime, time${month === 0 ? 11 : month - 1}, time${month}) VALUES ('${newState.id}', '${userName}', '${userTag}', '${userRole}', ${timeInChannel}, 0, ${timeInChannel})`);
        let currentUserIndex = channelUsers.findIndex(item => item.id === newState.id);
        channelUsers.splice(currentUserIndex, 1);
        return;
    }

    let tableTime = userData[`time${month}`];
    
    let tableTotalTime = userData.totalTime; 
    let resultTime = timeInChannel + tableTime;
    let resultTotalTime = timeInChannel + tableTotalTime;


    await connection.execute(`UPDATE time_online_test SET name='${userName}', tag='${userTag}', role='${userRole}', totalTime=${resultTotalTime}, time${month}=${resultTime} WHERE id=${currentUser.id}`); // !! currentUser.id = string?

    if (event) {
        let response = await connection.execute(`SELECT * FROM participants`);
        if ( !response[0].find(item => item.id === newState.id) ) {
            await connection.execute(`INSERT INTO participants (id, name, time) VALUES ('${newState.id}', '${newState.member.user.username}', 0)`);
            response = await connection.execute(`SELECT * FROM participants`);
        }
        let tableTime = response[0].find(item => item.id === newState.id).time;
        let resultTime = tableTime + timeInChannel;
        await connection.execute(`UPDATE participants SET name='${newState.member.user.username}', time=${resultTime} WHERE id=${currentUser.id}`);
    }

    let currentUserIndex = channelUsers.findIndex(item => item.id === newState.id);
    channelUsers.splice(currentUserIndex, 1);

    // await f3();

    await connection.end(); 
}

async function updateDB(DBLastMonth, response, connection) {

    // const connection = await mysql.createConnection(mysqlConfig);

    let month = new Date().getMonth();

    if (month !== DBLastMonth) {

        if ( month - DBLastMonth !== (-11 || 1) ) {
            await connection.execute(`ALTER TABLE time_online_test DROP COLUMN ${response[1][5].name}, DROP COLUMN ${response[1][6].name}, ADD COLUMN time${month === 0 ? 11 : month - 1} INT(10) UNSIGNED DEFAULT 0`);
        }
        else if (month === 0 || month === 1) { 
            await connection.execute(`ALTER TABLE time_online_test DROP COLUMN time${month + 10}`);
        } 
        else { 
            await connection.execute(`ALTER TABLE time_online_test DROP COLUMN time${month - 2}`);
        }

        await connection.execute(`ALTER TABLE time_online_test ADD COLUMN time${month} INT UNSIGNED DEFAULT 0`);
    }

    // await connection.end();

}

module.exports = {
    f1: f1,
    f2: f2,
    updateDB: updateDB,
};