const utils = require('./utils.js');
const phrases = require('./phrases.json');


class Dialog {
    static phases = null;

    constructor() {}

    async onClickCancel(interaction) {
        await this.startPrevPhase(interaction);
    }

    async startPhase(phase, interaction) {
        let msgData = await this.createMsg(phase);

        if (this.lastBotMsg) await utils.disableBtns(this.lastBotMsg);

        if (interaction) this.lastBotMsg = await interaction.editReply(msgData);
        else this.lastBotMsg = await this.channel.send(msgData);
    }

    async createMsg(phase) {
        let msgData = {
            content: phrases[phase.name][this.lang],
            fetchReply: true
        };
        
        if (phase.embed) msgData.embeds = [ await this[phase.embed.creatorFunc](...phase.embed.args) ];
        if (phase.toAdmins) {
            let regChannel = await this.channel.guil.channels.fetch('767326891291049994'); // !! id changed to test
            await regChannel.send({ embeds: [this[phase.embed.creatorFunc](...phase.embed.args)], components: utils.createOkNoBtns('confirm', 'deny') });
        }
        if (phase.btns) {
            msgData.components = [];
            if (phase.btns.cancel) msgData.components.push(...utils.createCancelBtn('cancel'));
            if (phase.btns.lang) msgData.components.push(...utils.createLangBtns());
            if (phase.btns.edit) {
                let ids = [];

                for (let key of this.params.keys()) ids.push(key);
                msgData.components.push(...utils.createEditBtns(ids));
            }
            if (phase.btns.okNo) msgData.components.push(...utils.createOkNoBtns('confirm', 'deny'));
        }

        return msgData;
    }

    async startFirstPhase(interaction) {
        this.curPhase = this.constructor.phases.head;
        await this.startPhase(this.curPhase, interaction);
    }

    async startNextPhase(interaction) {
        this.curPhase = this.curPhase.next;
        await this.startPhase(this.curPhase, interaction);
    }

    async startPrevPhase(interaction) {
        this.curPhase = this.curPhase.prev;
        await this.startPhase(this.curPhase, interaction);
    }

    async startEdit(interaction) {
        this.curPhase = this.constructor.phases.getByParam(interaction.customId);
        await this.startPhase(this.curPhase, interaction);
    }

    async onAnswer(msg) {
        if (!this.curPhase.regExp) {
            await msg.reply(phrases.use_btns[this.lang]);
            return;
        }
        else if (!this.isCorrectAnswer(msg.content)) {
            await msg.reply(phrases.incorrect_answer[this.lang]);
            return;
        }

        this.params.set(this.curPhase.param, msg.content);
        await this.startNextPhase();
    }

    isCorrectAnswer(answer) {
        return answer.match(this.curPhase.regExp) !== null;
    }

    clearParams() {
        this.params.clear();
    }
}

module.exports = { Dialog };