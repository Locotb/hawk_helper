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

        let parent = await member.guild.channels.fetch('416584939413438475');

        await member.roles.add('685130173670096907');
        let thisGuild = member.guild;
        this.channel = await thisGuild.channels.create(`❗${member.user.username} верификация`, {type: 'GUILD_TEXT', parent: parent, permissionOverwrites: permissions});
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
            await interaction.reply({ content: content, components: btns });
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

        btnsIds.push(...['ally', 'ambassador', 'cancel']); // !! массив зачем? можно убрать вроде
        btnsLabels.push(...['', '', '']);
        btnsEmojis.push(...['620724518717227009', '🕊️', '↩️']);
        btnsStyles.push(...['SECONDARY', 'SECONDARY', 'PRIMARY']);
    
        msg = this.getPhrase(this.phase.name); //phrases[this.lang].role_choice;
        btns = this.createBtns(btnsIds, btnsLabels, btnsEmojis, btnsStyles);

        await this.disableBtns(this.lastBotMsg);
        await interaction.reply({ content: msg, components: btns });
        this.lastBotMsg = await interaction.fetchReply();   
    }

    async startPhase(phaseName, interaction) { // interaction or message !!
        this.setPhase(phaseName);

        await this.disableBtns(this.lastBotMsg);
        if (interaction) { // if (typeof interaction !== 'string') - была ошибка, надо проверить !!
            // await interaction.reply({ content: this.phase.msgText, components: this.createCancelBtn() });
            await interaction.deferReply();
            await interaction.editReply({ content: this.getPhrase(phaseName), components: this.createCancelBtn() });
            this.lastBotMsg = await interaction.fetchReply();
        }
        // else this.lastBotMsg = await this.channel.send({ content: this.phase.msgText, components: this.createCancelBtn() });
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
        await interaction.reply({ content: phrases.ambassador_confirmation[this.lang], components: btns });
        this.lastBotMsg = await interaction.fetchReply();
    }

    async onConfirmInfoAmbassador() {
        let tMember = await this.channel.guild.members.fetch(this.memberId);

        await tMember.roles.add('411968125869752340');
        await tMember.roles.remove('685130173670096907');
        await this.channel.delete();
        await tMember.send(phrases.ambassador_welcome[this.lang]);
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
        await interaction.reply(`Я передам старейшинам о твоем прибытии в Hawkband. Принятие решения о твоем зачислении в братство Ястреба может занять некоторое время. Спасибо за ответы, ${this.name}.`);

        const verificationForm = new MessageEmbed()
            .setColor(this.role === 'recruit' ? '#75c482' : '#AD1457')
            .setTitle(`:envelope_with_arrow: Новая заявка на верификацию ${this.role === 'recruit' ? ':eagle:' : ':crossed_swords:'/*':620724518717227009:'*/}`) // !! побороться за кастомное эмодзи - потенциальный ответ = <:emoji_name:emoji_id>
            .setFooter('Hawkband Clan')
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
                await interaction.reply(this.getEditingPhrase(this.phase.name));
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

        await interaction.reply(`Заявка была **одобрена** пользователем ${interaction.user.username} (id ${interaction.user.id})\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);
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
        await interaction.reply(`Заявка была **отклонена** пользователем ${interaction.user.username} (id ${interaction.user.id})\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);
        
        let msg = `Твоя заявка на верификацию была отклонена старейшинами. Возможно, ты не соответствуешь требованием нашего сообщества`;
        // await verMember.kick(); !!
    
        await sendPM(msg, verMember.user, interaction.guild, 'об отказе заявки на верификацию');
    }

    async onConfirmFormAlly(interaction) {
        let verMember = await interaction.guild.members.fetch(this.memberId);
        
        if (!verMember) return; // !! такая ситуация может быть?
        await this.disableBtns(interaction.message);

        await interaction.reply(`Заявка была **одобрена** пользователем ${interaction.user.username} (id ${interaction.user.id})\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);
        await verMember.roles.add('697102081827274794');
        await verMember.roles.remove('685130173670096907');
        await this.channel.delete();
        let msg = `Поздравляю, верификация пройдена! Вся необходимая информация и правила есть на канале "Welcome": 
        \nhttps://discord.com/channels/394055433641263105/412643124830142468/706165211714945035\n
        Ознакомься с ними, если ты этого еще не сделал. Если у тебя остались какие-либо вопросы, обратись к братьям по оружию.`; // !! text
        
        await sendPM(msg, verMember.user, interaction.guild, 'об одобрении заявки на верификацию');
    }

    async onRejectFormAlly(interaction) {
        let verMember = await interaction.guild.members.fetch(this.memberId);

        if (!verMember) return; // !! такая ситуация может быть?
        await this.disableBtns(interaction.message);

        await verMember.roles.add('411968125869752340');
        await verMember.roles.remove('685130173670096907');

        await this.channel.delete();
        await interaction.reply(`Заявка была **отклонена** пользователем ${interaction.user.username} (id ${interaction.user.id})\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);
        
        let msg = `Твоя заявка на верификацию была отклонена старейшинами. Возможно, ты не соответствуешь требованием нашего сообщества`;
    
        await sendPM(msg, verMember.user, interaction.guild, 'об отказе заявки на верификацию');
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

    async disableBtns(msg) { // мб не передавать параметр, а внутри функции использовать this.lastBotMsg !!
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


async function onClickCancel(interaction, thisVerUser) {
    console.log('Пришли из onClickCancel');
    //await disableBtns(interaction.channel.messages, thisVerUser.lastBotMsgId);
    await disableBtns(thisVerUser.lastBotMsg);

    if (thisVerUser.role === 'recruit') {
        if (thisVerUser.phase === 3) {
            thisVerUser.phase = 2;
            await interaction.reply({ content: 'Как звать тебя, путник?\n```Ответом должно быть твое настоящее имя, написанное кириллицей```', components: createCancelBtn() });
        }
        else if (thisVerUser.phase === 4) {
            thisVerUser.phase = 3;
            await interaction.reply({ content: 'Сколько отроду лет тебе?\n```Ответом должно быть число```', components: createCancelBtn() });    
        }
        else if (thisVerUser.phase === 5) {
            thisVerUser.phase = 4; 
            await interaction.reply({ content: 'У тебя есть желание командовать ястребами?\n```Да/нет```', components: createCancelBtn() });
        }
        else if (thisVerUser.phase === 6) {
            thisVerUser.phase = 5;
            await interaction.reply({ content: 'Кто предложил тебе присоединиться к нам?\n```Ответом может быть имя человека, позвавшего тебя в клан, или название ресурса, с которого ты пришел```', components: createCancelBtn() });
        }

        else if (thisVerUser.phase === 2) {
            thisVerUser.phase = 1;
            await interaction.reply( createReply(thisVerUser.phase - 1, thisVerUser.language) );
            thisVerUser.role = ''; // !! как правильно убрать роль?
        }

        //console.log(`Установили lastBotMsgId в ${interaction.channel.lastMessage.id} [onClickCancel]`);
        //thisVerUser.lastBotMsgId = interaction.channel.lastMessage.id;
        let test = await interaction.fetchReply();
        console.log(`Установили lastBotMsgId в ${test.id} [onClickCancel]`);
        //thisVerUser.lastBotMsgId = test.id;
        thisVerUser.lastBotMsg = test;
        
        return;
    }

    if (thisVerUser.phase === 1) await interaction.reply({ content: `Повторный выбор языка`, components: createBtns(['ru', 'eng'], ['', ''], ['🇷🇺', '🇬🇧'], ['SECONDARY', 'SECONDARY']) });
    else await interaction.reply( createReply(thisVerUser.phase - 2, thisVerUser.language) );
    thisVerUser.phase--;
    
    //console.log(`Установили lastBotMsgId в ${interaction.channel.lastMessage.id} [onClickCancel 2]`);
    //thisVerUser.lastBotMsgId = interaction.channel.lastMessage.id;
    let test = await interaction.fetchReply();
    console.log(`Установили lastBotMsgId в ${test.id} [onClickCancel 2]`);
    //thisVerUser.lastBotMsgId = test.id;
    thisVerUser.lastBotMsg = test;
}

function createReply(phase, lang, btnId) {
    let msg, btns;

    if (phase === 0) {
        if (btnId === 'ru' || lang === 'ru') {
            msg = phrases.ru.role_choice;
            btns = createBtns(['recruit', 'ally', 'ambassador', 'cancel'], ['', '', '', ''], ['⚔️', '620724518717227009', '🕊️', '↩️'], ['SECONDARY', 'SECONDARY', 'SECONDARY', 'PRIMARY']);
        }
        else if (btnId === 'eng' || lang === 'eng') {
            msg = phrases.eng.role_choice;
            btns = createBtns(['ally', 'ambassador', 'cancel'], ['', '', ''], ['620724518717227009', '🕊️', '↩️'], ['SECONDARY', 'SECONDARY', 'PRIMARY']);
        }
    } 
    else if (phase === 1) {

        if (btnId === 'recruit') {
            msg = 'Отлично! Тогда начнем. Как звать тебя, путник?\n```Ответом должно быть твое настоящее имя, написанное кириллицей```';
            btns = createCancelBtn();
        }
        else if (btnId === 'ally') {
            msg = phrases[lang].type_clanName;
            btns = createCancelBtn();
        }
        else if (btnId === 'ambassador') {
            // msg = phrases[lang].ambassador_welcome;
            // btns = null;

            msg = phrases[lang].ambassador_confirmation;
            btns = createOkNoBtns('ok', 'no');
        }
    }
    else if (phase === 2) {

    }

    return { content: msg, components: btns };
}

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

    let parent = await member.guild.channels.fetch('416584939413438475');

    await member.roles.add('685130173670096907');
    let thisGuild = member.guild;
    let fortext = await thisGuild.channels.create(`❗${member.user.username} верификация`, {type: 'GUILD_TEXT', parent: parent, permissionOverwrites: permissions});

    let content = `<@${member.id}>\n🇷🇺 Приветствую тебя, путник. Меня зовут Добрыня, я помогу тебе освоиться здесь. Чтобы мы могли продолжить, выбери язык\n🇬🇧 Welcome you, stranger. My name is Dobrinya. I'm here for help you get comfortable here. So that we can continue, select a language`;
    let msg = await fortext.send({ content: content, components: createBtns(['ru', 'eng'], ['', ''], ['🇷🇺', '🇬🇧'], ['SECONDARY', 'SECONDARY']) });

    verificationUsers.push({
        userId: member.id,
        phase: 0,
        channelId: fortext.id,
        //lastBotMsgId: msg.id,
        lastBotMsg: msg,
    });

}

async function analyseInteraction(interaction, thisVerUser, verificationUsers) {
    console.log('Пришли из analyseInteraction');
    //await disableBtns(interaction.channel.messages, thisVerUser.lastBotMsgId); // !! безопасно ли?
    if (interaction.channelId === thisVerUser.channelId) await disableBtns(thisVerUser.lastBotMsg); // !! безопасно ли?

    if ((interaction.customId === 'ru' || interaction.customId === 'eng') && thisVerUser.phase === 0) {
        thisVerUser.language = interaction.customId;
        await interaction.reply( createReply(thisVerUser.phase, thisVerUser.language, interaction.customId) );
        thisVerUser.phase = 1;
    }
    else if ((interaction.customId === 'recruit' || interaction.customId === 'ally' || interaction.customId === 'ambassador') && thisVerUser.phase === 1) {
        thisVerUser.role = interaction.customId;
        await interaction.reply( createReply(thisVerUser.phase, thisVerUser.language, interaction.customId) );
        thisVerUser.phase = 2;
    }
    else if ((interaction.customId === 'ok' || interaction.customId === 'no') && thisVerUser.phase === 3) {
        await interaction.reply('Я отправил информацию старейшинам');
        let textVerChannel = await interaction.guild.channels.fetch('767326891291049994'); // !! заменен на тестовый
        const verificationForm = new MessageEmbed()
            .setColor('#AD1457')
            .setTitle(':envelope_with_arrow: Новая заявка на верификацию :crossed_swords:')
            .setFooter('Hawkband Clan')
            .addFields(
                {name: ' :classical_building: Название клана:', value: thisVerUser.clanName},
                {name: ' :video_game: Discord:', value: `${interaction.user.tag} <@${interaction.user.id}>`},
                {name: ' :id: id:', value: `${interaction.user.id}`})
            .setThumbnail(interaction.user.avatarURL()).setTimestamp();
        let embMsg = await textVerChannel.send({ embeds: [verificationForm], components: createOkNoBtns('ok_ally', 'no_ally') });

    }
    // else if ((interaction.customId === 'ok' || interaction.customId === 'no') && thisVerUser.phase === 7 && interaction.channelId === thisVerUser.channelId) {

    //     await interaction.reply(`Я передам старейшинам о твоем прибытии в Hawkband. Принятие решения о твоем зачислении в братство Ястреба может занять некоторое время. Спасибо за ответы, ${thisVerUser.name}.`);
    
    //     const verificationForm = new MessageEmbed()
    //         .setColor('#75c482')
    //         .setTitle(':envelope_with_arrow: Новая заявка на верификацию :eagle:')
    //         .setFooter('Hawkband Clan')
    //         .addFields(
    //             {name: ' :pencil: Имя:', value: thisVerUser.name}, 
    //             {name: ' :underage: Возраст:', value: thisVerUser.age},
    //             {name: ' :video_game: Discord:', value: `${interaction.user.tag} <@${thisVerUser.userId}>`},
    //             {name: ' :triangular_flag_on_post: Хочет ли командовать:', value: thisVerUser.command},
    //             {name: ' :information_source: Кто пригласил/откуда узнал:', value: thisVerUser.invite}, 
    //             {name: ' :desktop: Steam:', value: thisVerUser.steam},
    //             {name: ' :id: id:', value: `${interaction.user.id}`})
    //         .setThumbnail(interaction.user.avatarURL()).setTimestamp();
    //     let textVerChannel = await interaction.guild.channels.fetch('767326891291049994'); // !! заменен на тестовый
    //     let embMsg = await textVerChannel.send({ embeds: [verificationForm], components: createBtns(['ok_recruit', 'no_recruit'], ['', ''], ['✅', '❌'], ['SUCCESS', 'DANGER']) });

    // }
    else if ((interaction.customId === 'ok' || interaction.customId === 'no') && thisVerUser.phase === 2) {
        if (interaction.customId === 'ok') {
            msg = phrases[thisVerUser.language].ambassador_welcome;
            //btns = null;

            await interaction.reply({ content: msg/*, components: btns*/ });
        }
        else if (interaction.customId === 'no') {
            await interaction.reply( createReply(0, thisVerUser.language) );
            thisVerUser.phase = 1;
        }
        
    }
    
    if (interaction.channelId === '767326891291049994') { // !! заменен на тестовый
        let idField = interaction.message.embeds[0].fields.find(item => item.name === ':id: id:');
        let thisUserIndex = verificationUsers.findIndex(item => item.userId === idField.value);

        let verUser = await interaction.guild.members.fetch(verificationUsers[thisUserIndex].userId); // !! verUser на verMember
        
        if (!verUser) return; // !! такая ситуация может быть?
    
        await disableBtns(interaction.message);

        if (interaction.customId === 'ok_recruit') {
            await interaction.reply(`Заявка была одобрена пользователем ${interaction.user.username}\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);
            //let verUser = await interaction.guild.members.fetch(verificationUsers[thisUserIndex].userId); // !! verUser на verMember
            let firesideChannel = await interaction.guild.channels.fetch('767326891291049994'); // id заменен на тестовый !! fireside устарело, дать переменной универсальное имя
            let phrases1 = [ // !! название переменной
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
            let randomIndex = Math.trunc(Math.random() * 10); // !! можно заменить на навороченную формулу
            let msg = await firesideChannel.send(phrases1[randomIndex]);
            let emoji1 = interaction.guild.emojis.cache.get('620732643406774282');
            let emoji2 = interaction.guild.emojis.cache.get('620724518717227009');
            await msg.react('🦅');
            await msg.react(emoji1);
            await msg.react(emoji2); 
            await verUser.roles.add(['685130173154066480', '767732406235955221', '685131994069598227']);
            await verUser.roles.remove('685130173670096907');
            //await verUser.setNickname(`ᛩ ${verUser.user.username}`); // !! проверка на длину ника
            let forDelete = await interaction.guild.channels.fetch(verificationUsers[thisUserIndex].channelId);
            await forDelete.delete();
            // !! название переменной
            let msg1 = `Поздравляю, верификация пройдена! Вся необходимая информация и правила есть на канале "Welcome": 
            \nhttps://discord.com/channels/394055433641263105/412643124830142468/706165211714945035\n
            Ознакомься с ними, если ты этого еще не сделал. Если у тебя остались какие-либо вопросы, обратись к братьям по оружию.`; // переменная msg уже была создана выше
            
            await sendPM(msg1, verUser.user, interaction.guild, 'об одобрении заявки на верификацию');
            
            verificationUsers.splice(thisUserIndex, 1);
        }
        else if (interaction.customId === 'no_recruit') {
            //let verUser = await interaction.guild.members.fetch(verificationUsers[thisUserIndex].userId); // !! verUser на verMember            
            let forDelete = await interaction.guild.channels.fetch(verificationUsers[thisUserIndex].channelId);
            await forDelete.delete();
            await interaction.reply(`Заявка была отклонена пользователем ${interaction.user.username}\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);
            
            let msg = `Твоя заявка на верификацию была отклонена старейшинами. Возможно, ты не соответствуешь требованием нашего сообщества`;
            await sendPM(msg, verUser.user, interaction.guild, 'об отказе заявки на верификацию');
    
            // await verUser.kick();
            verificationUsers.splice(thisUserIndex, 1);
        }
        else if (interaction.customId === 'ok_ally') {
            let forDelete = await interaction.guild.channels.fetch(verificationUsers[thisUserIndex].channelId);
            await forDelete.delete();
            await interaction.reply(`Заявка была одобрена пользователем ${interaction.user.username}\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);
            
            await verUser.roles.add('697102081827274794');
            await verUser.roles.remove('685130173670096907');
            
            let msg = `Заявка одобрена`;
            await sendPM(msg, verUser.user, interaction.guild, 'об одобрении заявки на верификацию');
            verificationUsers.splice(thisUserIndex, 1);
        }
        else if (interaction.customId === 'no_ally') {
            let forDelete = await interaction.guild.channels.fetch(verificationUsers[thisUserIndex].channelId);
            await forDelete.delete();
            await interaction.reply(`Заявка была отклонена пользователем ${interaction.user.username}\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${interaction.message.id}`);
            let msg = `Заявка отклонена`;
            await sendPM(msg, verUser.user, interaction.guild, 'об отказе заявки на верификацию');
            verificationUsers.splice(thisUserIndex, 1);
        }
    }

    if (thisVerUser.channelId === interaction.channelId && thisVerUser.phase === 7) {
        let btnId = interaction.customId;

        if (btnId === 'confirm_verification_form') {
            await interaction.reply(`Я передам старейшинам о твоем прибытии в Hawkband. Принятие решения о твоем зачислении в братство Ястреба может занять некоторое время. Спасибо за ответы, ${thisVerUser.name}.`);
    
            const verificationForm = new MessageEmbed()
                .setColor('#75c482')
                .setTitle(':envelope_with_arrow: Новая заявка на верификацию :eagle:')
                .setFooter('Hawkband Clan')
                .addFields(
                    {name: ' :pencil: Имя:', value: thisVerUser.name}, 
                    {name: ' :underage: Возраст:', value: thisVerUser.age},
                    {name: ' :video_game: Discord:', value: `${interaction.user.tag} <@${thisVerUser.userId}>`},
                    {name: ' :triangular_flag_on_post: Хочет ли командовать:', value: thisVerUser.command},
                    {name: ' :information_source: Кто пригласил/откуда узнал:', value: thisVerUser.invite}, 
                    {name: ' :desktop: Steam:', value: thisVerUser.steam},
                    {name: ' :id: id:', value: `${interaction.user.id}`})
                .setThumbnail(interaction.user.avatarURL()).setTimestamp();
            let textVerChannel = await interaction.guild.channels.fetch('767326891291049994'); // !! заменен на тестовый
            let embMsg = await textVerChannel.send({ embeds: [verificationForm], components: createOkNoBtns('ok_recruit', 'no_recruit') });
        }
        else if (btnId === 'reject_verification_form') {}
        else if (btnId === 'first') {
            thisVerUser.phase = 8;
            await interaction.reply(`Введи новое имя`);
        }
        else if (btnId === 'second') {
            thisVerUser.phase = 9;
            await interaction.reply(`Введи новый возраст`);
        }
        else if (btnId === 'third') {
            thisVerUser.phase = 10;
            await interaction.reply(`Введи новый ответ на вопрос "хочешь ли стать командиром"`);
        }
        else if (btnId === 'fourth') {
            thisVerUser.phase = 11;
            await interaction.reply(`Введи новый ответ на вопрос "кто пригласил/откуда узнал"`);
        }
        else if (btnId === 'fifth') {
            thisVerUser.phase = 12;
            await interaction.reply(`Введи новый steam`);
        }
    }

    //console.log(`Установили lastBotMsgId в ${interaction.channel.lastMessage.id} [analyseInteraction]`);
    //thisVerUser.lastBotMsgId = interaction.channel.lastMessage.id; // !! безопасно ли?
    let test = await interaction.fetchReply();
    console.log(`Установили lastBotMsgId в ${test.id} [analyseInteraction]`);
    //thisVerUser.lastBotMsgId = test.id;
    thisVerUser.lastBotMsg = test;

}

async function manageDialog(message, thisVerUser) {
    let test;
    //console.log('Пришли из manageDialog');
    //await disableBtns(message.channel.messages, thisVerUser.lastBotMsgId); // !! безопасно ли? - no

    if (thisVerUser.role === 'recruit') {
        console.log('Пришли из manageDialog');
        //await disableBtns(message.channel.messages, thisVerUser.lastBotMsgId);
        await disableBtns(thisVerUser.lastBotMsg);
        if ((thisVerUser.phase === 2 || thisVerUser.phase === 8) && message.content.match(/[а-яА-ЯЁё]/)) {
            thisVerUser.name = message.content;
            if (thisVerUser.phase === 8) {
                thisVerUser.phase = 7;
                return;
            }
            thisVerUser.phase = 3;
            test = await message.channel.send({ content: 'Сколько отроду лет тебе?\n```Ответом должно быть число```', components: createCancelBtn() });
        }
        else if ((thisVerUser.phase === 3 || thisVerUser.phase === 9) && message.content.match(/\d+/)) {
            thisVerUser.age = message.content;
            if (thisVerUser.phase === 9) {
                thisVerUser.phase = 7;
                return;
            }
            thisVerUser.phase = 4;
            test = await message.channel.send({ content: 'У тебя есть желание командовать ястребами?\n```Да/нет```', components: createCancelBtn() });    
        }
        else if ((thisVerUser.phase === 4 || thisVerUser.phase === 10) && (message.content.match(/да/i) || message.content.match(/нет/i))) {
            thisVerUser.command = message.content;
            if (thisVerUser.phase === 10) {
                thisVerUser.phase = 7;
                return;
            }
            thisVerUser.phase = 5;
            test = await message.channel.send({ content: 'Кто предложил тебе присоединиться к нам?\n```Ответом может быть имя человека, позвавшего тебя в клан, или название ресурса, с которого ты пришел```', components: createCancelBtn() });
        }
        else if (thisVerUser.phase === 5 || thisVerUser.phase === 11) {
            thisVerUser.invite = message.content;
            if (thisVerUser.phase === 11) {
                thisVerUser.phase = 7;
                return;
            }
            thisVerUser.phase = 6;
            test = await message.channel.send({ content: 'У всех богатырей есть Steam, а у тебя?\n```Ответом должна быть ссылка на твой профиль в стиме```', components: createCancelBtn() });
        }
        else if ((thisVerUser.phase === 6 || thisVerUser.phase === 12) && message.content.match(/steamcommunity.com/)) {
            thisVerUser.steam = message.content;
            if (thisVerUser.phase === 12) {
                thisVerUser.phase = 7;
                return;
            }
            thisVerUser.phase = 7;

            const verificationForm = new MessageEmbed()
                .setColor('#75c482')
                .setTitle(':exclamation: Подтверждение информации :exclamation:')
                .setFooter('Hawkband Clan')
                .addFields(
                    {name: ' [1] :pencil: Имя:', value: thisVerUser.name}, 
                    {name: ' [2] :underage: Возраст:', value: thisVerUser.age},
                    {name: ' [3] :triangular_flag_on_post: Хочет ли командовать:', value: thisVerUser.command},
                    {name: ' [4] :information_source: Кто пригласил/откуда узнал:', value: thisVerUser.invite}, 
                    {name: ' [5] :desktop: Steam:', value: thisVerUser.steam},
                    {name: ' :video_game: Discord:', value: `${message.author.tag} <@${thisVerUser.userId}>`},
                    {name: ' :id: id:', value: `${message.author.id}`})
                .setThumbnail(message.author.avatarURL()).setTimestamp();
            let btns = createBtns(['first', 'second', 'third', 'fourth', 'fifth'], ['', '', '', '', ''], ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'], ['SECONDARY', 'SECONDARY', 'SECONDARY', 'SECONDARY', 'SECONDARY']);
            let btns2 = createOkNoBtns('confirm_verification_form', 'reject_verification_form');
            btns.push(...btns2);
            test = await message.reply({ content: 'Итак, вот твоя анкета. Пожалуйста, перепроверь всю информацию и нажми:\n1. Если все верно - ✅\n2. Если нужно изменить информацию - на соответствующую цифру\n3. Если хочешь вернуться на этап определения роли (следующий за выбором языка) - ❌\n', embeds: [verificationForm], components: btns });
        }
    }
    else if (thisVerUser.phase === 2 && thisVerUser.role === 'ally') {
        console.log('Пришли из manageDialog 2');
        //await disableBtns(message.channel.messages, thisVerUser.lastBotMsgId);
        await disableBtns(thisVerUser.lastBotMsg);

        test = await message.reply({ content: 'Подтверди информацию', components: createOkNoBtns('ok', 'no') });
        thisVerUser.clanName = message.content;
        thisVerUser.phase = 3;
    }

    //console.log(`Установили lastBotMsgId в ${message.channel.lastMessage.id} [manageDialog]`); // этого быть не должно, т.к. сюда приходим только если сообщение от юзера
    //thisVerUser.lastBotMsgId = message.channel.lastMessage.id; // !! безопасно ли?
    
    
    if (test) {
        console.log(`Установили lastBotMsgId в ${test.id} [manageDialog]`);
        //thisVerUser.lastBotMsgId = test.id;
        thisVerUser.lastBotMsg = test;
    }
}

async function analyseDecision(reaction, user, verificationUsers) {

    let thisGuild = reaction.message.guild; 

    let idField = reaction.message.embeds[0].fields.find(item => item.name === ':id: id:');
    let thisUserIndex = verificationUsers.findIndex(item => item.userId === idField.value);
    const sendPM = require('./sendPM.js');

    //if (!~thisUserIndex) return;
    if (thisUserIndex === -1) return;

    if (reaction.emoji.name === '✅') { 
        let verUser = await thisGuild.members.fetch(verificationUsers[thisUserIndex].userId); // !! verUser на verMember
        let firesideChannel = await reaction.message.guild.channels.fetch('767326891291049994'); // id заменен на тестовый !! fireside устарело, дать переменной универсальное имя
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
        let randomIndex = Math.trunc(Math.random() * 10); // !! можно заменить на навороченную формулу
        let msg = await firesideChannel.send(phrases[randomIndex]);
        let emoji1 = thisGuild.emojis.cache.get('620732643406774282');
        let emoji2 = thisGuild.emojis.cache.get('620724518717227009');
        await msg.react('🦅');
        await msg.react(emoji1);
        await msg.react(emoji2); 
        await verUser.roles.add(['685130173154066480', '767732406235955221', '685131994069598227']);
        await verUser.roles.remove('685130173670096907');
        verUser.setNickname(`ᛩ ${verUser.user.username}`); // !! проверка на длину ника
        let forDelete = await reaction.message.guild.channels.fetch(verificationUsers[thisUserIndex].channel);
        await forDelete.delete();
        await reaction.message.reactions.cache.find(item => item.emoji.name === '❌').remove();
        await reaction.message.channel.send(`Заявка была одобрена пользователем ${user.username}\nСсылка на пост: https://discord.com/channels/394055433641263105/547032514976415755/${reaction.message.id}`);
        
        
        
        let msg1 = `Поздравляю, верификация пройдена! Вся необходимая информация и правила есть на канале "Welcome": 
        \nhttps://discord.com/channels/394055433641263105/412643124830142468/706165211714945035\n
        Ознакомься с ними, если ты этого еще не сделал. Если у тебя остались какие-либо вопросы, обратись к братьям по оружию.`; // переменная msg уже была создана выше
        
        await sendPM(msg1, verUser.user, reaction.message.guild, 'об одобрении заявки на верификацию');
        
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

        await verUser.kick();
        verificationUsers.splice(thisUserIndex, 1);
    }
}