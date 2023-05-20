const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');


function createBtns(idsArr, labelsArr, emojisArr, stylesArr, rows) {
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

function createLangBtns() {
    return this.createBtns(['ru', 'eng'], ['', ''], ['🇷🇺', '🇬🇧'], [ButtonStyle.Secondary, ButtonStyle.Secondary], []); // !! supported languages
}

function createOkNoBtns(okId, noId) {
    return this.createBtns([okId, noId], ['', ''], ['✔️', '✖️'], [ButtonStyle.Success, ButtonStyle.Danger], []);
}

function createEditBtns(ids) {
    let emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    // emojis.splice(ids.length, emojis.length - ids.length)
    return this.createBtns(ids, Array(ids.length).fill(''), emojis, Array(ids.length).fill(ButtonStyle.Secondary), []);
}

function createCancelBtn(id) {
    return this.createBtns([id], [''], ['↩️'], [ButtonStyle.Primary], []);
}

async function disableBtns(msg) {
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


module.exports = {
    createBtns,
    createLangBtns,
    createOkNoBtns,
    createEditBtns,
    createCancelBtn,
    disableBtns,
};