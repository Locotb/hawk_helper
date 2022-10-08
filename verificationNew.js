const { MessageEmbed, MessageActionRow, MessageButton, Interaction } = require('discord.js');
const phrases = require('./phrases.json');
const sendPM = require('./sendPM.js');

const phases = new Map();
const phasesNames = ['langChoice', 'roleChoice', 'recruitName', 'recruitAge', 'recruitCommand', 'recruitInvite', 'recruitSteam', 'confirmInfo', 'allyClanName'];
const phasesIds = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const phasesMsgs = [
    `🇷🇺 Приветствую тебя, путник. Меня зовут Добрыня, я помогу тебе освоиться здесь. Чтобы мы могли продолжить, выбери язык\n🇬🇧 Welcome you, stranger. My name is Dobrinya. I'm here for help you get comfortable here. So that we can continue, select a language`,
    '',
    'Отлично! Тогда начнем. Как звать тебя, путник?\n```Ответом должно быть твое настоящее имя, написанное кириллицей```',
    'Сколько отроду лет тебе?\n```Ответом должно быть число```',
    'У тебя есть желание командовать ястребами?\n```Да/нет```',
    'Кто предложил тебе присоединиться к нам?\n```Ответом может быть имя человека, позвавшего тебя в клан, или название ресурса, с которого ты пришел```',
    'У всех богатырей есть Steam, а у тебя?\n```Ответом должна быть ссылка на твой профиль в стиме```',
    'Итак, вот твоя анкета. Пожалуйста, перепроверь всю информацию и нажми:\n1. Если все верно - ✅\n2. Если нужно изменить информацию - на соответствующую цифру\n3. Если хочешь вернуться на этап определения роли (следующий за выбором языка) - ❌\n',
    'Отлично! Из какого ты клана?'
];
const phasesEdits = [
    '',
    '',
    'Как звать тебя, путник?\n```Ответом должно быть твое настоящее имя, написанное кириллицей```',
    'Сколько отроду лет тебе?\n```Ответом должно быть число```',
    'У тебя есть желание командовать ястребами?\n```Да/нет```',
    'Кто предложил тебе присоединиться к нам?\n```Ответом может быть имя человека, позвавшего тебя в клан, или название ресурса, с которого ты пришел```',
    'У всех богатырей есть Steam, а у тебя?\n```Ответом должна быть ссылка на твой профиль в стиме```',
    '',
    'Из какого ты клана?'
];
const phasesParams = ['', '', 'name', 'age', 'command', 'invite', 'steam', '', 'clanName'];
const phasesParamTxts = ['', '', ' :pencil: Имя:', ' :underage: Возраст:', ' :triangular_flag_on_post: Хочет ли командовать:', ' :information_source: Кто пригласил/откуда узнал:', ' :desktop: Steam:', '', ' :classical_building: Название клана:'];
const phasesRegExps = ['', '', /[а-яА-ЯЁё]/, /\d+/, /да|нет/i, /\D/, /steamcommunity.com/, '', /\D/];

for (let i = 0; i < phasesNames.length; i++) phases.set(phasesNames[i], { id: phasesIds[i], name: phasesNames[i], msgText: phasesMsgs[i], editingTxt: phasesEdits[i], param: phasesParams[i], paramTxt: phasesParamTxts[i], regexp: phasesRegExps[i] });


module.exports = class Verification {
    constructor(member) {
        this.memberId = member.id;
        this.params = [];
        this.editingId = -1;
        this.create(member);
    }

    async create(member) {        
        let permissions = [
            {
                id: this.memberId,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
            },
            {
                id: '911932147948990535', // bot's permissions
                allow: ['VIEW_CHANNEL'],
            },
            {
                id: member.guild.roles.everyone,
                deny: ['VIEW_CHANNEL'],
            },
        ];

        let parent = await member.guild.channels.fetch('416584939413438475'); // категория "информация"

        await member.roles.add('685130173670096907'); // новобранец
        let thisGuild = member.guild;
        this.channel = await thisGuild.channels.create(`❗${member.user.username} верификация`, { type: 'GUILD_TEXT', parent: parent, permissionOverwrites: permissions });
        this.channelId = this.channel.id;

        await this.startLangChoice();
    }

    async startLangChoice(interaction) {
        let content = '', btns = [], btnsIds = ['ru', 'eng'], btnsLabes = ['', ''], btnsEmojis = ['🇷🇺', '🇬🇧'], btnsStyles = ['SECONDARY', 'SECONDARY'];

        this.setPhase('langChoice');
        btns = this.createBtns(btnsIds, btnsLabes, btnsEmojis, btnsStyles);
        if (this.lang) content = this.getEditingPhrase(this.phase.name);
        else content = `<@${this.memberId}>\n${this.phase.msgText}`;

        if (this.lastBotMsg) await this.disableBtns(this.lastBotMsg);

        if (interaction) {
            await interaction.editReply({ content: content, components: btns });
            this.lastBotMsg = await interaction.fetchReply();
        }
        else this.lastBotMsg = await this.channel.send({ content: content, components: btns });
    }

    async startRoleChoice(interaction) {
        let msg = '', btnsIds = [], btnsLabels = [], btnsEmojis = [], btnsStyles = [], btns; //, lang = 

        if (interaction.customId !== 'cancel' && interaction.customId !== 'reject_verification_info') this.lang = interaction.customId;;
        this.setPhase('roleChoice');
        this.params = [];

        if (this.lang === 'ru') {
            btnsIds.push('recruit');
            btnsLabels.push('');
            btnsEmojis.push('⚔️');
            btnsStyles.push('SECONDARY');
        }

        btnsIds.push('ally', 'ambassador', 'cancel');
        btnsLabels.push('', '', '');
        btnsEmojis.push('620724518717227009', '🕊️', '↩️');
        btnsStyles.push('SECONDARY', 'SECONDARY', 'PRIMARY');
    
        msg = this.getPhrase(this.phase.name);
        btns = this.createBtns(btnsIds, btnsLabels, btnsEmojis, btnsStyles);

        await this.disableBtns(this.lastBotMsg);
        await interaction.editReply({ content: msg, components: btns });
        this.lastBotMsg = await interaction.fetchReply();   
    }

    async startPhase(phaseName, interaction) { // interaction or message !!
        this.setPhase(phaseName);

        await this.disableBtns(this.lastBotMsg);
        if (interaction) { // if (typeof interaction !== 'string') - была ошибка, надо проверить !!
            await interaction.editReply({ content: this.getPhrase(phaseName), components: this.createCancelBtn() });
            this.lastBotMsg = await interaction.fetchReply();
        }
        else this.lastBotMsg = await this.channel.send({ content: this.getPhrase(this.phase.name), components: this.createCancelBtn() });
    }

    async startNextPhase() {
        if (this.phase.id === 6) await this.startInfoConfirmation();
        else {
            for (let phase of phases) {
                if (phase[1].id === this.phase.id + 1) { // continue !!
                    await this.startPhase(phase[0]); 
                    break;
                }
            }   
        }
    }

    async startPrevPhase(interaction) { // !! нужно использовать editingTxt
        if (this.phase.id === 2 || this.phase.id === 8) await this.startRoleChoice(interaction);
        else if (this.phase.id === 1) await this.startLangChoice(interaction);
        else {
            for (let phase of phases) {
                if (phase[1].id === this.phase.id - 1) { // continue !!
                    await this.startPhase(phase[0], interaction); 
                    break;
                }
            }
        }
    }

    async onSelectAmbassador(interaction) {
        this.setPhase('confirmInfo');
        await this.disableBtns(this.lastBotMsg);

        let btns = this.createOkNoBtns('confirm_verification_info_ambassador', 'reject_verification_info');
        await interaction.editReply({ content: phrases.ambassador_confirmation[this.lang], components: btns });
        this.lastBotMsg = await interaction.fetchReply();
    }

    async onConfirmInfoAmbassador() {
        let tMember = await this.channel.guild.members.fetch(this.memberId);

        await tMember.roles.add('411968125869752340');
        await tMember.roles.remove('685130173670096907');
        await this.channel.delete();
        await tMember.send(phrases.ambassador_welcome[this.lang]); // sendPM !!
    }

    async startInfoConfirmation() {
        let btns = [], btns2 = [], btnsIds = [], btnsLabels = [], btnsEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'], btnsStyles = [], // в одной строке вроде мб максимум 5 кнопок !!
            tMember = await this.channel.guild.members.fetch(this.memberId);

        btnsEmojis.slice(0, this.params.length);

        this.setPhase('confirmInfo');
        await this.disableBtns(this.lastBotMsg);

        let params = [];
        this.params.forEach( (param, i) => {
            params.push({ name: `[${i + 1}] ${param.name}`, value: param.value });

            btnsIds.push(`param${i}`);
            btnsLabels.push('');
            btnsStyles.push('SECONDARY');
        });

        const verificationForm = new MessageEmbed()
                .setColor(this.role === 'recruit' ? '#75c482' : '#AD1457')
                .setTitle(':exclamation: Подтверждение информации :exclamation:')
                .setFooter('Hawkband Clan')
                .addFields(...params)
                .setThumbnail(tMember.user.avatarURL()).setTimestamp();

        btns = this.createBtns(btnsIds, btnsLabels, btnsEmojis, btnsStyles);
        btns2 = this.createOkNoBtns('confirm_verification_info', 'reject_verification_info');
        btns.push(...btns2); // !! если btns = [row] и btns2 = [row], то надо ли так делать?
        // this.lastBotMsg = await this.channel.send({ content: this.phase.msgText, embeds: [verificationForm], components: btns });
        this.lastBotMsg = await this.channel.send({ content: this.getPhrase(this.phase.name), embeds: [verificationForm], components: btns });
    }

    async sendFormToAdmins(interaction) {
        await interaction.editReply(phrases.application_sended[this.lang] + (this.name ? this.name : interaction.member.nickname));

        await this.disableBtns(this.lastBotMsg);

        const verificationForm = new MessageEmbed()
            .setColor(this.role === 'recruit' ? '#75c482' : '#AD1457')
            .setTitle(`:envelope_with_arrow: Новая заявка на верификацию ${this.role === 'recruit' ? ':eagle:' : ':crossed_swords:'/*':620724518717227009:'*/}`) // !! побороться за кастомное эмодзи - потенциальный ответ = <:emoji_name:emoji_id>
            .setFooter('Hawkband Clan') // !!
            .addFields(...this.params,
                { name: ' :video_game: Discord:', value: `${interaction.user.tag} <@${this.memberId}>` },
                { name: ' :id: id:', value: `${interaction.user.id}` })
            .setThumbnail(interaction.user.avatarURL()).setTimestamp();
        let textVerChannel = await interaction.guild.channels.fetch('767326891291049994'); // !! заменен на тестовый
        let embMsg = await textVerChannel.send({ embeds: [verificationForm], components: this.createOkNoBtns(`ok_${this.role}`, `no_${this.role}`) });
    }

    saveAnswer(answer) {
        let param = this.params.find(param => param.name === this.phase.paramTxt);
        if (param) param.value = answer;
        else this.params.push({ name: this.phase.paramTxt, value: answer });
        //this.params[this.phase.param] = answer;
    }

    isCorrectAnswer(answer) {
        if (this.phase.regexp !== '') return answer.match(this.phase.regexp) === null ? false : true;
        else return false;
    }

    async startEditing(interaction) {
        this.editingId = +interaction.customId.match(/\d/)[0];
        let phaseId;
        
        if (this.editingId === 0) phaseId = this.role === 'recruit' ? this.editingId + 2 : 8;
        else phaseId = this.editingId + 2;

        await this.disableBtns(this.lastBotMsg);
        for (let phase of phases) {
            if (phase[1].id === phaseId) {
                this.setPhase(phase[0]);
                await interaction.editReply(this.getEditingPhrase(this.phase.name));
                break;
            }
        }
    }

    async editInfo(answer) {
        // this.params.find(param => param.name === this.phase.paramTxt).value = answer;
        // await this.startInfoConfirmation();


        this.params[this.editingId].value = answer;
        this.editingId = -1;
        await this.startInfoConfirmation();
    }

    getPhrase(key) { // из getPhrase и getEditingPhrase сделать одну функцию? !!
        return phrases[key][this.lang];
    }

    getEditingPhrase(key) {
        return phrases[`${key}_editing`] ? phrases[`${key}_editing`][this.lang] : phrases[key][this.lang]
    }

    setPhase(phaseName) {
        this.phase = phases.get(phaseName);
    }

    // confirmInfo() {}

    // rejectInfo() {}

    async onConfirmForm(interaction) {
        let verMember = await interaction.guild.members.fetch(this.memberId);
        
        if (!verMember) return; // !! такая ситуация может быть?
        await this.disableBtns(interaction.message);

        await interaction.editReply(`Заявка была **одобрена** пользователем ${interaction.user.username} (id ${interaction.user.id})\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);
        let firesideChannel = await interaction.guild.channels.fetch('767326891291049994'); // id заменен на тестовый !! fireside устарело, дать переменной универсальное имя
        let phrases1 = [ // !! название переменной
            `<@&685131993955958838> <@&685131994069598227>\nЭй вы, воины грозные, спешить во все концы! Несите весточку радостную: быть в лагере нашем пиру богатому в честь прибытия ястреба нового, имя которому <@${verMember.id}> :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nИ был пир на весь мир за воина ратного <@${verMember.id}>, что в братсво Ястреба вступил... Люду доброму на радость, да злым врагам на зависть! И я там был, мед-пиво пил, по усам текло, да в рот не попало! :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nОткупоривай бочки с пивом-медом да наливай поскорей до краев, не жалей! Праздник у нас сегодня знатный будет... Поднимем же кубки за воина новобранного, имя которому <@${verMember.id}> :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nЖгите костры сигнальные, шлите весточку братьям на дальних рубежах, чтобы ехали на пир славный в честь прибытия воина великого, звать которого <@${verMember.id}>. Поприветствуем его, братья, словом добрым, да кубком полным хмельной медовухи. Улыбнется же Ястреб нам, да загрустит враг от того, насколько велико бравое воинство Hawkband :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nСегодня солнце теплее, лица добрее, медовуха вкуснее. Ястребы кружат над головами суровых бойцов - знак это добрый без спору. Закатывай пир! С новым братом, чье имя <@${verMember.id}>, обязательно мы победим! :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nРазошлите весть добрую по лагерю нашему: прибыл к нам новый боец, имя которому <@${verMember.id}>. Ястреб, будь вежлив с новым братом по оружию, подними кубок эля за здоровье и удачу его! :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nСлавься воинство Ястреба, звонарь же бей в колокола, да будут залиты медовухой кубки. Отныне пополнятся знамена наши, ибо воин бравый <@${verMember.id}> примкнул к нам. Да прибудет с тобой Ястреб :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nА и сильные, могучие воины в славном братсве Ястреба! Не скакать врагам по нашей земле! Не топтать их коням землю нашу родную! Не затмить им солнце наше красное! Поприветствуем же брата нового, имя которому <@${verMember.id}>, что горой станет в стене щитов наших, что дуб столентний с корнем вырвет, если тот путь преграждать будет! :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nВек стоит лагерь наш - не шатается! И века простоит - не шелохнется! <@${verMember.id}>, за тебя, воин славный, мы кубки до краев полные поднимаем! Не подводи братьев-ястребов! :eagle:`,
            `<@&685131993955958838> <@&685131994069598227>\nСегодня день благодатный, ибо стал под наши знамена воин знатный <@${verMember.id}>. На бой, ястребы! Разобьем врагов полчище несметное! Слава да почет ждут нас не только в нашем народе, но и в других странах заморских! :eagle:`,
        ];
        let randomIndex = Math.trunc(Math.random() * 10); // !! можно заменить на навороченную формулу
        let msg = await firesideChannel.send(phrases1[randomIndex]);
        let emoji1 = interaction.guild.emojis.cache.get('620732643406774282');
        let emoji2 = interaction.guild.emojis.cache.get('620724518717227009');
        await msg.react('🦅');
        await msg.react(emoji1);
        await msg.react(emoji2); 
        await verMember.roles.add(['685130173154066480', '767732406235955221', '685131994069598227']);
        await verMember.roles.remove('685130173670096907');
        //await verUser.setNickname(`ᛩ ${verUser.user.username}`); // !! проверка на длину ника
        await this.channel.delete();
        // !! название переменной
        let msg1 = `Поздравляю, верификация пройдена! Вся необходимая информация и правила есть на канале "Welcome": 
        \nhttps://discord.com/channels/394055433641263105/412643124830142468/706165211714945035\n
        Ознакомься с ними, если ты этого еще не сделал. Если у тебя остались какие-либо вопросы, обратись к братьям по оружию.`; // переменная msg уже была создана выше
        
        await sendPM(msg1, verMember.user, interaction.guild, 'об одобрении заявки на верификацию');
    }

    async onRejectForm(interaction) {
        let verMember = await interaction.guild.members.fetch(this.memberId);

        if (!verMember) return; // !! такая ситуация может быть?
        await this.disableBtns(interaction.message);

        await this.channel.delete();
        await interaction.editReply(`Заявка была **отклонена** пользователем ${interaction.user.username} (id ${interaction.user.id})\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);
        
        let msg = `Твоя заявка на верификацию была отклонена старейшинами. Возможно, ты не соответствуешь требованием нашего сообщества`;
        // await verMember.kick(); !!
    
        await sendPM(msg, verMember.user, interaction.guild, 'об отказе заявки на верификацию');
    }

    async onConfirmFormAlly(interaction) {
        let verMember = await interaction.guild.members.fetch(this.memberId);
        
        if (!verMember) return; // !! такая ситуация может быть?
        await this.disableBtns(interaction.message);

        await interaction.editReply(`Заявка была **одобрена** пользователем ${interaction.user.username} (id ${interaction.user.id})\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);
        await verMember.roles.add('697102081827274794');
        await verMember.roles.remove('685130173670096907');
        await this.channel.delete();
        
        // txt form_confirmed_ally !!
        await sendPM(phrases.form_confirmed_ally[this.lang], verMember.user, interaction.guild, 'об одобрении заявки на верификацию');
    }

    async onRejectFormAlly(interaction) {
        let verMember = await interaction.guild.members.fetch(this.memberId);

        if (!verMember) return; // !! такая ситуация может быть?
        await this.disableBtns(interaction.message);

        await verMember.roles.add('411968125869752340');
        await verMember.roles.remove('685130173670096907');

        await this.channel.delete();
        await interaction.editReply(`Заявка была **отклонена** пользователем ${interaction.user.username} (id ${interaction.user.id})\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);
    
        // txt form_rejected_ally !!
        await sendPM(phrases.form_rejected_ally[this.lang], verMember.user, interaction.guild, 'об отказе заявки на верификацию');
    }

    createBtns(idsArr, labelsArr, emojisArr, stylesArr) {
        let btns = [];
        for (let i = 0; i < idsArr.length; i++) {
            btns.push(new MessageButton()
                .setCustomId(idsArr[i])
                .setLabel(labelsArr[i])
                .setEmoji(emojisArr[i])
                .setStyle(stylesArr[i]));
        }
        let row = new MessageActionRow().addComponents(...btns);
        return [row];
    }

    async disableBtns(msg) { // мб не передавать параметр, а внутри функции использовать this.lastBotMsg !! - с onConfirmForm не прокатит
        let btns = [], rows = [];  // мб ситуация, когда у сообщения больше одного ряда кнопок
    
        msg.components.forEach(btnsRow => {
            btnsRow.components.forEach(btn => {
                btn.setDisabled(true);
                btns.push(btn);
            });
            rows.push(new MessageActionRow().addComponents(...btns));
            btns = [];
        });
        


        // msg.components[0].components.forEach(component => {
        //     component.setDisabled(true);
        //     btns.push(component);
        // });
        // row = new MessageActionRow().addComponents(...btns);
    
        if (msg.content && !msg.embeds) await msg.edit({ content: msg.content, components: rows });
        else if (!msg.content && msg.embeds) await msg.edit({ embeds: msg.embeds, components: rows });
        else if (msg.content && msg.embeds) await msg.edit({ content: msg.content, embeds: msg.embeds, components: rows });
    }

    createOkNoBtns(okId, noId) {
        return this.createBtns([okId, noId], ['', ''], ['✔️', '✖️'], ['SUCCESS', 'DANGER']);
    }

    createCancelBtn() {
        return this.createBtns(['cancel'], [''], ['↩️'], ['PRIMARY'])
    }

    destroy() { // нужно? !!
        
    }
}