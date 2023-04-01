const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits, ChannelType, ButtonStyle } = require('discord.js');
const phrases = require('./phrases.json');
const sendPM = require('./sendPM.js');

const phases = new Map();
const phasesNames = ['langChoice', 'roleChoice', 'recruitName', 'recruitAge', 'recruitCommand', 'recruitInvite', 'recruitSteam', 'confirmInfo', 'allyClanName'];
const phasesParams = ['', '', 'name', 'age', 'command', 'invite', 'steam', '', 'clanName'];
const phasesParamTxts = ['', '', ' :pencil: Имя:', ' :underage: Возраст:', ' :triangular_flag_on_post: Хочет ли командовать:', ' :information_source: Кто пригласил/откуда узнал:', ' :desktop: Steam:', '', ' :classical_building: Название клана:'];
const phasesRegExps = ['', '', /[а-яА-ЯЁё]/, /\d+/, /да|нет/i, /\D/, /steamcommunity.com/, '', /\D/];

for (let i = 0; i < phasesNames.length; i++) phases.set(phasesNames[i], { id: i, name: phasesNames[i], param: phasesParams[i], paramTxt: phasesParamTxts[i], regexp: phasesRegExps[i] });

const rolesIds = {
    recruit: ['685130173154066480', '767732406235955221', '685131994069598227'],
    ally: '697102081827274794',
    ambassador: '411968125869752340',
};


class Verification {
    constructor(member) {
        this.id = member.id;
        this.channel = member.channel || null;
        this.lastBotMsg = member.lastBotMsg || null;
        this.phase = member.phase || null;
        this.lang = member.lang || '';
        this.role = member.role || '';
        this.params = [];
        this.editingId = -1;
        this.phasesMap = ['langChoice', 'roleChoice'];
    }

    async create(member) {
        let permissions = [
            {
                id: member.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
            },
            {
                id: '911932147948990535', // bot's permissions
                allow: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: member.guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel],
            },
        ];

        let parent = await member.guild.channels.fetch('416584939413438475'); // категория "информация"
        this.channel = await member.guild.channels.create({ name: `❗${member.user.username} верификация`, type: ChannelType.GuildText, parent: parent, permissionOverwrites: permissions });

        await member.roles.add('685130173670096907'); // новобранец

        await this.startLangChoice();
    }

    async startLangChoice(interaction) {
        let content = '', btns = [], btnsIds = ['ru', 'eng'], btnsLabes = ['', ''], btnsEmojis = ['🇷🇺', '🇬🇧'], btnsStyles = [ButtonStyle.Secondary, ButtonStyle.Secondary];

        this.setPhase('langChoice');
        btns = this.createBtns(btnsIds, btnsLabes, btnsEmojis, btnsStyles, []);
        if (this.lang) content = this.getPhrase('langChoice_editing');
        else content = `<@${this.id}>\n${phrases.langChoice.ru}`;

        if (this.lastBotMsg) await this.disableBtns(this.lastBotMsg);

        if (interaction) {
            this.lastBotMsg = await interaction.editReply({ content: content, components: btns });
            // this.lastBotMsg = await interaction.fetchReply();
        }
        else this.lastBotMsg = await this.channel.send({ content: content, components: btns });
    }

    async startRoleChoice(interaction) {
        let msg = '', btnsIds = [], btnsLabels = [], btnsEmojis = [], btnsStyles = [], btns;
        await this.disableBtns(this.lastBotMsg);
        this.setPhase('roleChoice');

        if (interaction.customId !== 'cancel' && interaction.customId !== 'reject_verification_info') this.lang = interaction.customId;
        this.params = [];

        if (this.lang === 'ru') {
            btnsIds.push('recruit');
            btnsLabels.push('');
            btnsEmojis.push('🦅');
            btnsStyles.push(ButtonStyle.Secondary);
        }

        btnsIds.push('ally', 'ambassador', 'cancel');
        btnsLabels.push('', '', '');
        btnsEmojis.push('620724518717227009', '🕊️', '↩️');
        btnsStyles.push(ButtonStyle.Secondary, ButtonStyle.Secondary, ButtonStyle.Secondary);
    
        msg = this.getPhrase(this.phase.name);
        btns = this.createBtns(btnsIds, btnsLabels, btnsEmojis, btnsStyles, []);
        this.lastBotMsg = await interaction.editReply({ content: msg, components: btns });
        // this.lastBotMsg = await interaction.fetchReply();   
    }

    async startPhase(phaseName, interaction) {
        let msg = this.getPhrase(phaseName), btn = this.createCancelBtn();
        
        this.setPhase(phaseName);
        await this.disableBtns(this.lastBotMsg);

        if (interaction) {
            this.lastBotMsg = await interaction.editReply({ content: msg, components: btn });
            // this.lastBotMsg = await interaction.fetchReply();
        }
        else this.lastBotMsg = await this.channel.send({ content: msg, components: btn });
    }

    async startNextPhase(interaction) {
        let nextPhase = this.phasesMap[this.phasesMap.indexOf(this.phase.name) + 1];

        if (nextPhase === 'roleChoice') await this.startRoleChoice(interaction);
        else if (nextPhase === 'confirmInfo') await this.startInfoConfirmation(interaction);
        else await this.startPhase(nextPhase, interaction);
    }

    async startPrevPhase(interaction) {
        let prevPhase = this.phasesMap[this.phasesMap.indexOf(this.phase.name) - 1];

        if (prevPhase === 'langChoice') await this.startLangChoice(interaction);
        else if (prevPhase === 'roleChoice') await this.startRoleChoice(interaction);
        else await this.startPhase(prevPhase, interaction);
    }

    async startInfoConfirmation() {
        let btns = [], btns2 = [], btnsIds = [], btnsLabels = [], btnsEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'], btnsStyles = [],
            tMember = await this.channel.guild.members.fetch(this.id);

        btnsEmojis.splice(this.params.length, btnsEmojis.length - this.params.length);

        this.setPhase('confirmInfo');
        await this.disableBtns(this.lastBotMsg);

        let params = [];
        this.params.forEach( (param, i) => {
            params.push({ name: `[${i + 1}] ${param.name}`, value: param.value });

            btnsIds.push(`param${i}`);
            btnsLabels.push('');
            btnsStyles.push(ButtonStyle.Secondary);
        });

        const verificationForm = new EmbedBuilder()
            .setColor(this.role === 'recruit' ? '#75c482' : '#AD1457')
            .setTitle(`:exclamation: ${this.lang === 'ru' ? 'Подтверждение информации' : 'Confirmation of information'} :exclamation:`)
            .setFooter({ text: 'Hawkband Clan' })
            .addFields(...params)
            .setThumbnail(tMember.user.avatarURL()).setTimestamp();

        btns = this.createBtns(btnsIds, btnsLabels, btnsEmojis, btnsStyles, []);
        btns2 = this.createOkNoBtns('confirm_verification_info', 'reject_verification_info');
        btns.push(...btns2);
        this.lastBotMsg = await this.channel.send({ content: this.getPhrase(this.phase.name), embeds: [verificationForm], components: btns });
    }

    async sendFormToAdmins(interaction) {
        await this.channel.permissionOverwrites.edit(this.id, { SendMessages: false });
        await interaction.editReply(this.getPhrase('application_sended') + interaction.member.nickname);

        await this.disableBtns(this.lastBotMsg);

        const verificationForm = new EmbedBuilder()
            .setColor(this.role === 'recruit' ? '#75c482' : '#AD1457')
            .setTitle(`:envelope_with_arrow: Новая заявка на верификацию ${this.role === 'recruit' ? ':eagle:' : '<:notwar:620724518717227009>'}`)
            .setFooter({ text: 'Hawkband Clan' })
            .addFields(...this.params,
                { name: ' :video_game: Discord:', value: `${interaction.user.tag} <@${this.id}>` },
                { name: ' :id: id:', value: `${interaction.user.id}` })
            .setThumbnail(interaction.user.avatarURL()).setTimestamp();
        let textVerChannel = await interaction.guild.channels.fetch('767326891291049994'); // !! заменен на тестовый
        this.lastBotMsg = await textVerChannel.send({ embeds: [verificationForm], components: this.createOkNoBtns(`ok_${this.role}`, `no_${this.role}`) });
    }

    async onConfirmForm(interaction) {
        let tMember = await this.channel.guild.members.fetch(this.id);

        await tMember.roles.add(rolesIds[this.role]);
        await tMember.roles.remove('685130173670096907');
        await this.channel.delete();
        await sendPM(this.getPhrase(`form_confirmed_${this.role}`), tMember.user, tMember.guild, `об одобрении заявки на верификацию (${this.role})`);
    }

    async onRejectForm(interaction) {
        let verMember = await interaction.guild.members.fetch(this.id);

        await this.disableBtns(interaction.message);
        await interaction.editReply(`Заявка была **отклонена** пользователем ${interaction.user.username} (id ${interaction.user.id})\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);
        
        await verMember.roles.add(rolesIds.ambassador);
        await verMember.roles.remove('685130173670096907');

        await this.channel.delete();
        await sendPM(this.getPhrase(`form_rejected_${this.role}`), verMember.user, interaction.guild, 'об отказе заявки на верификацию');
    }

    async onLeaveGuild() {
        await this.disableBtns(this.lastBotMsg);
        await this.lastBotMsg.reply(`Верификация отменена. Пользователь покинул сервер`);
        await this.channel.delete();
    }

    saveAnswer(answer) {
        let param = this.params.find(param => param.name === this.phase.paramTxt);
        if (param) param.value = answer;
        else this.params.push({ name: this.phase.paramTxt, value: answer });
    }

    isCorrectAnswer(answer) {
        if (this.phase.regexp !== '') return answer.match(this.phase.regexp) !== null;
        else return false;
    }

    async startEditing(interaction) {
        await this.disableBtns(this.lastBotMsg);

        this.editingId = +interaction.customId.match(/\d/)[0];

        for (let phase of phases) {
            if (phase[1].paramTxt === this.params[this.editingId].name) {
                this.setPhase(phase[0]);
                await interaction.editReply(this.getPhrase(this.phase.name));
                break;
            }
        }
    }

    async editInfo(answer) {
        this.params[this.editingId].value = answer;
        this.editingId = -1;
        await this.startInfoConfirmation();
    }

    getPhrase(key) {
        return phrases[key][this.lang];
    }

    setPhase(phaseName) {
        this.phase = phases.get(phaseName);
    }

    createBtns(idsArr, labelsArr, emojisArr, stylesArr, rows) {
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

    createOkNoBtns(okId, noId) {
        return this.createBtns([okId, noId], ['', ''], ['✔️', '✖️'], [ButtonStyle.Success, ButtonStyle.Danger], []);
    }

    createCancelBtn() {
        return this.createBtns(['cancel'], [''], ['↩️'], [ButtonStyle.Primary], []);
    }

    async disableBtns(msg) {
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
}


class Recruit_Verification extends Verification {
    constructor(verMember) {
        super(verMember);
        this.phasesMap = ['langChoice', 'roleChoice', 'recruitName', 'recruitAge', 'recruitCommand', 'recruitInvite', 'recruitSteam', 'confirmInfo']; 
    }

    async onConfirmForm(interaction) {
        await super.onConfirmForm(interaction);

        let tMember = interaction.member;

        await this.disableBtns(interaction.message);
        await interaction.editReply(`Заявка была **одобрена** пользователем ${interaction.user.username} (id ${interaction.user.id})\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);

        let welcomeChannel = await interaction.guild.channels.fetch('767326891291049994'); // id заменен на тестовый !!
        let randomIndex = Math.trunc(Math.random() * 10); // !! можно заменить на навороченную формулу
        let welcomeMsgPrefix = '<@&685131993955958838> <@&685131994069598227>\n';
        let welcomeMsg = phrases.recruit_welcome.ru[randomIndex].replace('<@>', `<@${tMember.id}>`);
        let msg = await welcomeChannel.send(welcomeMsgPrefix + welcomeMsg);
        await msg.react('🦅');
        await msg.react(interaction.guild.emojis.cache.get('620732643406774282'));
        await msg.react(interaction.guild.emojis.cache.get('620724518717227009')); 
        let nick = `ᛩ ${tMember.user.username}`.substring(0, 32);
        await interaction.client.setNickname(nick);
    }
}


class Ally_Verification extends Verification {
    constructor(verMember) {
        super(verMember);
        this.phasesMap = ['langChoice', 'roleChoice', 'allyClanName', 'confirmInfo'];
    }

    async onConfirmForm(interaction) {
        await super.onConfirmForm(interaction);
        await this.disableBtns(interaction.message);
        await interaction.editReply(`Заявка была **одобрена** пользователем ${interaction.user.username} (id ${interaction.user.id})\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);
    }
}


class Ambassador_Verification extends Verification {
    constructor(verMember) {
        super(verMember);
        this.phasesMap = ['langChoice', 'roleChoice', 'confirmInfo'];
    }

    async startInfoConfirmation(interaction) {
        this.setPhase('confirmInfo');
        await this.disableBtns(this.lastBotMsg);
        let btns = this.createOkNoBtns('ok_ambassador', 'reject_verification_info');
        this.lastBotMsg = await interaction.editReply({ content: this.getPhrase('ambassador_confirmation'), components: btns });
        // this.lastBotMsg = await interaction.fetchReply();
    }

    onLeaveGuild() {}
}


module.exports = { Verification, Recruit_Verification, Ally_Verification, Ambassador_Verification };