async function manageGameRoles(reaction, user, action) {
    let memberRoles = reaction.message.guild.members.cache.get(user.id).roles;

    // if (action === 'add') {
        await memberRoles[action]('786495891926024192'); // !! если пользователь снимет реакцию, бот уберет роль
        switch (reaction.emoji.name) {
            case '🤺':
                await memberRoles[action]('775647785558474753'); // total war
            break;
            case '🗽':
                await memberRoles[action]('775651543680548875'); // paradox
            break;
            case '✈️':
                await memberRoles[action]('775651344286482442'); // war thunder
            break;
            case '🌴':
                await memberRoles[action]('775408949288632372'); // rising storm
            break;
            case '🪓':
                await memberRoles[action]('812314071282089984'); // valheim
            break;
        }
    // }
    // else if (action === 'remove') {
        // switch (reaction.emoji.name) {
        //     case '🤺':
        //         await memberRoles.remove('775647785558474753'); // total war
        //     break;
        //     case '🗽':
        //         await memberRoles.remove('775651543680548875'); // paradox
        //     break;
        //     case '✈️':
        //         await memberRoles.remove('775651344286482442'); // war thunder
        //     break;
        //     case '🌴':
        //         await memberRoles.remove('775408949288632372'); // rising storm
        //     break;
        //     case '🪓':
        //         await memberRoles.remove('812314071282089984'); // valheim
        //     break;
        // }
    // }  
}

module.exports = manageGameRoles;