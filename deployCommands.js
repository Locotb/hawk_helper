const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

const commands = [
	new SlashCommandBuilder().setName('help').setDescription('Список доступных комманд и их описание'),

	new SlashCommandBuilder().setName('data').setDescription('Узнать свою статистику')
    	.addBooleanOption(option => option.setName('private').setDescription('Отправить статистику в лс')),

	new SlashCommandBuilder().setName('notice').setDescription('Разослать оповещения')
		.addRoleOption(option => option.setName('роль').setDescription('Оповещение будет разослано всем, у кого есть эта роль').setRequired(true))
		.addStringOption(option => option.setName('текст').setDescription('Текст оповещения').setRequired(true)),

	new SlashCommandBuilder().setName('createlistenedchannel').setDescription('Создать голосовой канал с отслеживанием проведенного в нем времени')
		.addStringOption(option => option.setName('название').setDescription('Название канала (сущ. в родительном падеже)').setRequired(true)),

	// new SlashCommandBuilder().setName('delete').setDescription('Удалить процесс верификации')
    // 	.addChannelOption(option => option.setName('канал').setDescription('Канал верификации для удаления').setRequired(true)),

	// new SlashCommandBuilder().setName('data private').setDescription('Оповестить'),
]
    .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);