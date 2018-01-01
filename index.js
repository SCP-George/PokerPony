//import files and classes
const Discord = require('discord.js'),
    config = require('./data/config.json'),
    token = require('C:/Users/robin/OneDrive/Dokumente/GitHub/token.json'),
    i18n = {
        games: {
            start_game: 'Poker!',
            his_turn: '{{username}} ist dran!'
        },
        messages: {
            info: {
                color: '#55FF55',
                texts: {
                    help: {
                        title: 'Befehle ',
                        description: 'join | Runde beitreten \n' +
                            'ready | Karten nehmen \n' +
                            'call | Mitgehen \n' +
                            'raise <wert> | Erhöhen \n' +
                            'check | Passen (0 Runde) \n' +
                            'info | Info\'s halt..\nfold | Aussteigen \n' +
                            'all -in | HALLT ALLES'
                    },
                    created: {
                        title: 'Spiel von {{username}} erstellt',
                        description: 'tritt mit \'join\' bei!'
                    },
                    his_turn: {
                        title: '{{username}} ist dran!',
                        description: ''
                    },
                    chat_clear: {
                        title: 'Der Chat wurde geleert',
                        description: 'Endlich mal platz hier!'
                    }
                },
                setup: {
                    color: '#FFB700',
                    texts: {
                        no_money: {
                            title: 'Achtung',
                            description: 'Du hast nicht genügend Geld ({{money}})'
                        },
                        to_less_raise: {
                            title: 'Achtung',
                            description: 'Erhöre mindestens um {{money}}'
                        },
                        not_created: {
                            title: 'Achtung',
                            description: 'Es ist noch kein Spiel erstellt!'
                        },
                        not_started: {
                            title: 'Achtung',
                            description: 'Es ist noch kein Spiel gestartet!'
                        },
                        already_created: {
                            title: 'Achtung',
                            description: 'Es wurde bereits ein Spiel erstellt.'
                        },
                        already_started: {
                            title: 'Achtung',
                            description: 'Es läuft bereits ein Spiel.'
                        },
                        missing_players: {
                            title: 'Nicht genügent Spieler',
                            description: 'mindestens 2 Spieler werden gebraucht!'
                        }
                    },
                },
                error: {
                    color: '#FF0000',
                    texts: {
                        denied: {
                            title: 'Verweigert',
                            description: '{{username}} du hast keine Rechte dafür.'
                        }
                    }
                }
            }
        }
    };

//creation instance
const bot = new Discord.Client();

const matches = [];

const highCards = ['jack', 'queen', 'king', 'ace'],
    cardTypes = ['diamonds', 'hearts', 'spades', 'clubs'];

/** round:
 *   0 = wait for players (created)
 *   1 = round started (first deal round)
 *   2 = turn start
 *   3 = flop start
 *   4 = river start
 *   5 = end (calculation)
 */

bot.login(token.myToken);

bot.on('ready', () => {
    bot.user.setGame(i18n.games.start_game);
    log('Bot loaded!');
});

bot.on('message', msg => {
    // if (!(msg.content[0] === '/' && msg.channel.id === config.channelID))
    //     return;
    if (msg.author.bot) {
        if (msg.embeds[0].title.includes(':spades:')) return;

        msg.delete(config.deleteTime);

        return;
    }
    msg.delete();

    log(msg.author.username + '(' + msg.author.id + '): ' + msg.content);

    //const cmdParts = msg.content.split('/')[1].split(' ');
    const cmdParts = msg.content.split(' ');
    if (methods[cmdParts[0]]) return methods[cmdParts[0]](msg,
        cmdParts
            .slice(1));

    methods.help(msg);
});

// +-------------------+
// |     FUNCTIONS     |
// +-------------------+

//after game is finished or stopped, all its messages (which IDs will be saved) will be deleted (using methods.clear)

const methods = {
    info(msg) { },
    debug(msg) {
        console.log('isOwner: ', msg.author.id);
        console.log('players:');
        console.log(players);
        console.log('gameInfos:');
        console.log(gameInfos);
    },
    create(msg, args) {
        if (matches.find(channel => channel.id == msg.channel.id))
            return sendMessage(msg, 'setup', 'not_created', msg.author.username);

        matches.push({
            id: msg.channel.id,
            owner: msg.author.id,
            cash: args[0] || config.startAmount,
            pot: 0,
            call: 0,
            round: 0,
            subRound: false,
            currentPlayer: 0,
            cards: [],
            players: [],
            messages: []
        });

        return sendMessage(msg, 'info', 'created', msg.author.username);
    },
    start(msg) {
        let match = matches.find(channel => channel.id == msg.channel
            .id);

        //@TODO was ist das
        if (!match || match.owner != msg.author.id) return sendMessage(msg, 'setup',
            'not_created');

        if (!match.round) return sendMessage(msg, 'setup',
            'already_started');

        if (match.players < config.minPlayers) return sendMessage(msg, 'setup', 'missing_players');

        match.round++;

        match.players.forEach(player => (player.cards = [...(
            new Array(
                2))
            .map(item => getCheckedRandomCard())
        ])
            .forEach(
            card => msg.author.sendFile(getCardFile(
                card))));

        //@TODO
        sendMessage(msg, 'info', 'his_turn');

    },
    stop(msg) {
        let match = matches.find(channel => channel.id == msg.channel
            .id);
        if (!match || match.owner != msg.author.id) return;
        matches.splice(matches.indexOf(match), 1);
    },
    join(msg) {
        let match = matches.find(channel => channel.id === msg.channel
            .id);
        if (!match) return;
        players.push({
            obj: msg.author,
            cash: match.cash,
            state: 'join',
            call: 0,
            cards: []
        });
    },
    call(msg, args) {

        let match = matches.find(channel => channel.id == msg.channel
            .id);
        call = args[0];
        if (!match) return sendMessage(msg, 'setup', 'not_started');
        if (match.currentPlayer !== msg.author.id) return;
        const currentPlayer = match.players.indexOf(match.players
            .find(
            player => player.id === match.currentPlayer
            ));
        const call = parseInt(args[0]) || match.call;
        if (!call) return; //@TODO replace call with raise
        if (currentPlayer.cash < call) return sendMessage(msg, 'setup', 'no_money', currentPlayer.cash);
        if (call < match.call) return sendMessage(msg, 'setup', 'to_less_raise', match.call);
        match.call = call;

        match.pot += match.subRound ? match.call -
            currentPlayer.call :
            match.call;

        player.cash += player.call - match.call;

        player.call = match.call;
        //TODO gameInfos???
        if (!players.some(player => player.call !== gameInfos.call)) {
            match.round++;
            match.currentPlayer = 0;
            match.call = 0;

            match.players.forEach(player => player.call = 0);


            bot.user.setGame(i18n.games.his_turn.replace(/{{.*}}/, match.players[match.currentPlayer].obj.username));

            for (let i = 0; i < (match.round === 2 ? 3 : 1); i++) {
                const card = getCheckedRandomCard();

                match.cards.push(card);

                msg.channel.sendFile(getCardFile(card));
            }

            return sendMessage(msg, 'info', 'his_turn');
        }

        match.currentPlayer++;
        for (; match.currentPlayer < match.players.length &&
            match.players[
                match.currentPlayer].state === 'out'; match.currentPlayer++
        ) {
            if (match.players[match.currentPlayer].call ===
                match.call) {
                bot.user.setGame(i18n.games.his_turn.replace(/{{.*}}/, match.players[match.currentPlayer].obj.username));
                return sendMessage(msg, 'info', 'his_turn');
            }

            if (match.currentPlayer >= match.players.length) {
                match.currentPlayer = 0;
                match.subRound = true;
            }
        }
    },
    /*
    check(msg) {
        let match = matches.find(channel => channel.id == msg.channel
            .id);
        if (!match) return;
        if (match.currentPlayer !== msg.author.id) return;
        const currentPlayer = match.players.indexOf(match.players
            .find(
            player => player.id === match.currentPlayer
            ));
        const call = parseInt(args[0]) || match.call;
        if (!call) return;
        if (currentPlayer.cash < call) return;
        if (call < match.call) return;

        match.call = call;

        match.pot += match.subRound ? match.call -
            currentPlayer.call :
            match.call;

        player.cash += player.call - match.call;

        player.call = match.call;

        if (!players.some(player => player.call !== gameInfos.call)) {
            match.round++;
            match.currentPlayer = 0;
            match.call = 0;

            match.players.forEach(player => player.call = 0);


            bot.user.setGame(i18n.games.his_turn.replace(/{{.*}}/, match.players[match.currentPlayer]
                .obj.username));

            for (let i = 0; i < (match.round === 2 ? 3 : 1); i++) {
                const card = getCheckedRandomCard();

                match.cards.push(card);

                msg.channel.sendFile(getCardFile(card));
            }

            return;
        }

        match.currentPlayer++;
        for (; match.currentPlayer < match.players.length &&
            match.players[
                match.currentPlayer].state === 'out'; match.currentPlayer++
        ) {
            if (match.players[match.currentPlayer].call ===
                match.call) {
                const user = match.players[match.currentPlayer].obj.username;
                bot.user.setGame(i18n.games.his_turn.replace(/{{.*}}/,user));
                return sendMessage(msg, 'info', 'his_turn', user);
            }

            if (match.currentPlayer >= match.players.length) {
                match.currentPlayer = 0;
                match.subRound = true;
            }
        }
    },
    */
    clear(msg) {
        let match = matches.find(channel => channel.id == msg.channel
            .id);
        msg.channel.bulkDelete(100);
        if (!match || match.owner != msg.author.id) return sendMessage(
            msg, 'info', 'chat_clear');

    },
    help(msg) { sendMessage(msg, 'info', 'help'); }
}

function getCardName(card) {
    return
    `${(card.value > 10 ? highCards[(card.value % 10) - 1] : card.value)}_of_${cardTypes[card.type]}`;
}

//generate a checked random card
function getCheckedRandomCard(match) {
    const cards = [...match.cards];

    match.players.forEach(player => cards.push(...player.cards));

    const types = [];

    cardTypes.forEach(type => {
        const cardsOfType = cards.filter(card => card.type ===
            cardTypes[i])
            .map(card => card.value);

        if (cardsOfType.length)
            types.push({
                type: cardTypes[i],
                cards: (new Array(13)).map((item, index) => index +
                    2)
                    .filter(item => !cardsOfType.includes(
                        item))
            });
    });

    const type = types[Math.floor(Math.random() * types.length)];
    const value = type.cards[Math.floor(Math.random() * type.cards.length)];

    return {
        type,
        value
    };
}

//get the crad file
function getCardFile(card) {
    return `./cards/${getCardName(card)}.png`;
}

function sendMessage(msg, type, tag, data) {
    const embed = new Discord.RichEmbed();

    const color = i18n.messages[type].color;
    const text = i18n.messages[type].texts[tag];
    const title = text.title.replace(/{{.*}}/, data ? data : '');
    const description = text.description.replace(/{{.*}}/, data ? data : '');
    embed.setTitle(title);
    embed.setDescription(description);
    embed.setColor(color);
    log(`bot(0): ${title}, ${description}`);
    msg.channel.sendEmbed(embed);
}

//log service
function log(msg) {
    console.log('[' + Math.round((new Date())
        .getTime() / 1000) + '] ' + msg);
}
