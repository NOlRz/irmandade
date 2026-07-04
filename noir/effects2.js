document.addEventListener('DOMContentLoaded', () => {
    const userId = "1395261726022307960";
    
    function createDiscordCard(data) {
        const user = data.discord_user;
        const status = data.discord_status;
        const activities = data.activities || [];
        
        // Status colors
        const statusColors = {
            'online': '#43b581',
            'idle': '#faa61a',
            'dnd': '#f04747',
            'offline': '#747f8d'
        };
        
        const statusColor = statusColors[status] || statusColors.offline;
        
        // Avatar URL
        const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`;
        
        // Display name (nome de exibição ou global_name)
        const displayName = user.display_name || user.global_name || user.username;
        
        // Badge icons mapping
        const badgeIcons = {
            'staff': '<img src="https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png" style="width:18px;height:18px;" title="Discord Staff">',
            'partner': '<img src="https://cdn.discordapp.com/badge-icons/3f9748e53446a137a052f3454e2de41e.png" style="width:18px;height:18px;" title="Partnered Server Owner">',
            'hypesquad': '<img src="https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png" style="width:18px;height:18px;" title="HypeSquad Events">',
            'bug_hunter_level_1': '<img src="https://cdn.discordapp.com/badge-icons/2717692c7dca7289b35297368a940dd0.png" style="width:18px;height:18px;" title="Bug Hunter Level 1">',
            'hypesquad_online_house_1': '<img src="https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png" style="width:18px;height:18px;" title="HypeSquad Bravery">',
            'hypesquad_online_house_2': '<img src="https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png" style="width:18px;height:18px;" title="HypeSquad Brilliance">',
            'hypesquad_online_house_3': '<img src="https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png" style="width:18px;height:18px;" title="HypeSquad Balance">',
            'bug_hunter_level_2': '<img src="https://cdn.discordapp.com/badge-icons/848f79194d4be5ff5f81505cbd0ce1e6.png" style="width:18px;height:18px;" title="Bug Hunter Level 2">',
            'verified_bot_developer': '<img src="https://cdn.discordapp.com/badge-icons/6df5892e0f35b051f8b61eace34f4967.png" style="width:18px;height:18px;" title="Early Verified Bot Developer">',
            'early_supporter': '<img src="https://cdn.discordapp.com/badge-icons/7060786766c9c840eb3019e725d2b358.png" style="width:18px;height:18px;" title="Early Supporter">',
            'active_developer': '<img src="https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png" style="width:18px;height:18px;" title="Active Developer">',
            'certified_moderator': '<img src="https://cdn.discordapp.com/badge-icons/fee1624003e2fee35cb398e125dc479b.png" style="width:18px;height:18px;" title="Discord Certified Moderator">',
            'nitro': '<img src="https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png" style="width:18px;height:18px;" title="Nitro">',
            'server_boost': '<img src="https://cdn.discordapp.com/badge-icons/51040c70d4f20a921ad6674ff86fc95c.png" style="width:18px;height:18px;" title="Server Booster">', 
            'quest': '<img src="https://cdn.discordapp.com/badge-icons/7d9ae358c8c5e118768335dbe68b4fb8.png" style="width:18px;height:18px;" title="Completou uma Miss\u00e3o">',
            'quest_lastmeadow': '<img src="https://cdn.discordapp.com/badge-icons/ca105ad9cfc8580c765101d17bbb2323.png" style="width:18px;height:18px;" title="Last Meadow Online">'
        };
        
        // Gera badges HTML
        let badgesHTML = '';
        const userBadges = [];
        
        // Adiciona badges do public_flags
        if (user.public_flags !== undefined && user.public_flags !== null) {
            const flags = user.public_flags;
            const flagMapping = {
                1: 'staff',
                2: 'partner',
                4: 'hypesquad',
                8: 'bug_hunter_level_1',
                64: 'hypesquad_online_house_1',
                128: 'hypesquad_online_house_2',
                256: 'hypesquad_online_house_3',
                16384: 'bug_hunter_level_2',
                131072: 'verified_bot_developer',
                512: 'early_supporter',
                4194304: 'active_developer',
                262144: 'certified_moderator'
            };
            
            for (const [flag, name] of Object.entries(flagMapping)) {
                if (flags & parseInt(flag)) {
                    if (badgeIcons[name]) {
                        userBadges.push(badgeIcons[name]);
                    }
                }
            }
        }
        
        // Detecta Nitro via avatar_decoration ou collectibles (Lanyard não expõe premium_type)
        const hasNitro = user.avatar_decoration_data != null
            || (data.collectibles && data.collectibles.nameplate != null)
            || (user.premium_type && user.premium_type > 0);

        // Ordem igual ao Discord: nitro → server boost → quest genérico → quest específico
        if (hasNitro) {
            userBadges.push(badgeIcons['nitro']);
        }
        userBadges.push(badgeIcons['server_boost']);
        userBadges.push(badgeIcons['quest']);
        userBadges.push(badgeIcons['quest_lastmeadow']);
        
        if (userBadges.length > 0) {
            badgesHTML = `<div style="display: flex; gap: 4px; flex-wrap: wrap; align-items: center; justify-content: flex-end;">${userBadges.join('')}</div>`;
        }
        
        // Encontra atividade principal
        let activity = activities.find(a => a.type === 0) || activities[0];
        
        let cardHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(17, 17, 17, 0.95), rgba(30, 30, 30, 0.95));
                border-radius: 10px;
                padding: 12px 18px;
                width: 100%;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                border: 1px solid rgba(193, 139, 224, 0.3);
            ">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="position: relative; flex-shrink: 0;">
                        <img src="${avatarUrl}" style="
                            width: 60px;
                            height: 60px;
                            border-radius: 50%;
                            border: 2px solid ${statusColor};
                        ">
                        <div style="
                            position: absolute;
                            bottom: 0px;
                            right: 0px;
                            width: 16px;
                            height: 16px;
                            background: ${statusColor};
                            border-radius: 50%;
                            border: 3px solid rgba(17, 17, 17, 0.95);
                        "></div>
                    </div>
                    <div style="flex: 1; min-width: 0; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="
                                font-family: 'Bold', sans-serif;
                                font-size: 17px;
                                color: #fff;
                                margin-bottom: 2px;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            ">${displayName}</div>
                            <div style="
                                font-family: 'Light', sans-serif;
                                font-size: 12px;
                                color: rgba(255, 255, 255, 0.5);
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            ">@${user.username}</div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 3px;">
                            ${badgesHTML}
                            <div style="
                                font-family: 'Light', sans-serif;
                                font-size: 12px;
                                color: ${statusColor};
                                text-transform: capitalize;
                            ">${status}</div>
                        </div>
                    </div>
                </div>`;
        
        // Adiciona atividade se existir
        if (activity) {
            cardHTML += `
                <div style="
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <div style="
                        font-family: 'Light', sans-serif;
                        font-size: 12px;
                        color: #c18be0;
                        white-space: nowrap;
                    ">🎮 Playing:</div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="
                            font-family: 'Light', sans-serif;
                            font-size: 14px;
                            color: #fff;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        ">${activity.name}</div>
                        ${activity.details ? `<div style="
                            font-family: 'Light', sans-serif;
                            font-size: 11px;
                            color: rgba(255, 255, 255, 0.6);
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        ">${activity.details}</div>` : ''}
                    </div>
                </div>`;
        }
        
        cardHTML += `</div>`;
        
        return cardHTML;
    }
    
    fetch(`https://api.lanyard.rest/v1/users/${userId}`)
        .then(response => {
            if (!response.ok) throw new Error('Erro na resposta');
            return response.json();
        })
        .then(data => {
            if (data.success && data.data) {
                const croppedDiv = document.querySelector('.cropped');
                if (croppedDiv) {
                    croppedDiv.innerHTML = createDiscordCard(data.data);
                }
            } else {
                console.error('❌ Entre no servidor: https://discord.gg/lanyard');
                document.querySelector('.pre-container').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('❌ Erro:', error);
            document.querySelector('.pre-container').style.display = 'none';
        });
});
