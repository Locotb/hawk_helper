const mysql = require('mysql2/promise');
const { mysqlConfig } = require('./config.json');
const m = require('./main.js');

const rolesIds = [
    '411942349753548800', // воевода
    '681420100565467157', // глава совета
    '681410021463949322', // старейшина
    '769887786806411274', // староста
    '684046420000374950', // сотник
    '684046428783378435', // десятник
    '684046480247488514', // хорунжий
    '685130078098948099', // первый богатырь
    '685130164061208787', // богатырь
    '685130169195036700', // дружинник
    '685130171040268414', // гридень
    '685130172047163490', // ратник
    '685130173154066480', // ополченец
    '687287277956890661', // пенсия
];


class ListenedMember {
    constructor(newState, role) {
        this.id = newState.id;
        this.role = role;
        this.connectionTime = 0;
        this.disconnectionTime = 0;
    }

    static getRole(memberRoles) {
        for (let i = 0; i < rolesIds.length; i++) {
            let role = memberRoles.cache.get(rolesIds[i]);
            if (!role) continue;
            return role.name;
        }
    }

    async onConnect(newState) {
        this.connectionTime = Date.now();
        await m.robot.specChannels.logs.send(`[${new Date().toLocaleString('ru')}] ${newState.member.user.username} подключился`);
    }

    async onDisconnect(newState, event) {
        this.disconnectionTime = Date.now();
        let timeInChannel = Math.trunc( (this.disconnectionTime - this.connectionTime)/1000 );

        let userName = newState.member.user.username;
        await m.robot.specChannels.logs.send(`[${new Date().toLocaleString('ru')}] ${userName} отключился\nВремя, которое ${userName} провел в голосовом канале: ${timeInChannel}`);

        const connection = await mysql.createConnection(mysqlConfig);

        // let response = await connection.execute(`SHOW COLUMNS FROM time_online_test LIKE 'time${month}'`);
        let response = await connection.execute(`SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'time_online_test'`);
        let DBLastMonth = +response[0].at(-1).match(/\d+/)[0];
        let month = new Date().getMonth();

        if (month !== DBLastMonth) await this.updateDB(DBLastMonth, response, connection);
    
        await connection.execute(`INSERT INTO time_online_test 
            (id, name, tag, role, totalTime, time${month === 0 ? 11 : month - 1}, time${month}) 
            VALUES ('${newState.id}', '${userName}', '${newState.member.user.discriminator}', '${this.role}', ${timeInChannel}, 0, ${timeInChannel}) 
            ON DUPLICATE KEY UPDATE name = '${userName}', tag = '${newState.member.user.discriminator}', role = '${this.role}', totalTime = totalTime + ${timeInChannel}, time${month} = time${month} + ${timeInChannel}`);

        if (event) { // !!
            let response = await connection.execute(`SELECT * FROM participants WHERE id=${newState.id}`);
            if (!response[0][0]) {
                await connection.execute(`INSERT INTO participants (id, name, time) VALUES ('${newState.id}', '${newState.member.user.username}', 0)`);
                response = await connection.execute(`SELECT * FROM participants WHERE id=${newState.id}`);
            }
            let tableTime = response[0].time + timeInChannel;
            await connection.execute(`UPDATE participants SET name='${newState.member.user.username}', time=${tableTime} WHERE id=${this.id}`);
        }

        await connection.end(); 
    }

    async updateDB(DBLastMonth, response, connection) {
        let month = new Date().getMonth();
    
        if (month - DBLastMonth !== -11 || month - DBLastMonth !== 1 ) { // если было пропущено обновление таблицы
            await connection.execute(`ALTER TABLE time_online_test DROP COLUMN ${response[1][5].name}, DROP COLUMN ${response[1][6].name}, ADD COLUMN time${month === 0 ? 11 : month - 1} INT(10) UNSIGNED DEFAULT 0`);
        }
        else if (month === 0 || month === 1) { // если начался новый год, удаление ноябрьского/декабрьского столбца
            await connection.execute(`ALTER TABLE time_online_test DROP COLUMN time${month + 10}`);
        } 
        else {
            await connection.execute(`ALTER TABLE time_online_test DROP COLUMN time${month - 2}`);
        }

        await connection.execute(`ALTER TABLE time_online_test ADD COLUMN time${month} INT UNSIGNED DEFAULT 0`);
    }
}


module.exports = { ListenedMember };