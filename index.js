//import files and classes
const Discord = require('discord.js'),
    config = require('./data/config.json'),
    token = require('C:/Users/robin/OneDrive/Dokumente/GitHub/token.json'),
    i18n = require('./data/i18n.json');
//creation instance
const bot = new Discord.Client();

const matches = [];

const highCards = ['jack', 'queen', 'king', 'ace'],
    cardTypes = ['diamonds', 'hearts', 'spades', 'clubs'];

/** match.round:
 * null = not created
 *    0 = wait for players (created)
 *    1 = round started (first deal round)
 *    2 = turn start
 *    3 = flop start
 *    4 = river start
 *    5 = end (calculation)
 */

 /** Player Object
     obj: msg.author,
     cash: match.cash,
     state: 'join',
     call: 0,
     cards: []
  */

 /** Match Object
     id: msg.channel.id,
     owner: msg.author.id,
     cash: args[0] || config.startAmount,
     pot: 0,
     call:  0,
     round
     subRound: false,
     currentPlayer: 0,
     cards: [],
     players: [],
     messages: []
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
        if ((Array.isArray(msg.embeds) && msg.embeds.length && msg.embeds[0].title.includes(':spades:')) || msg.attachments.some(file => file.filename)) return;

        //msg.delete(config.deleteTime);

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



//after game is finished or stopped, all its messages (which IDs will be saved) will be deleted (using methods.clear)
const methods = {
    info(msg) { },
    debug(msg) { //debug for admin
        log('isOwner: ', msg.author.id);
        log('players:');
        log(players);
        log('gameInfos:');
        log(gameInfos);
    },
    create(msg, args) { //create game
        if (matches.find(channel => channel.id == msg.channel.id))
            return sendMessage(msg, 'setup', 'not_created', msg.author.username);

        const match = {
            id: msg.channel.id,
            owner: msg.author.id,
            cash: args[0] || config.startAmount,
            pot: 0,
            call: 0,
            round: 0,
            subRound: false,
            currentPlayer: 1,
            cards: [],
            players: [],
            messages: []
        };

        match.players.push({
            obj: msg.author,
            cash: match.cash,
            state: 'join',
            call: 0,
            cards: []
        });

        matches.push(match);

        return sendMessage(msg, 'info', 'created', msg.author.username);
    },
    start(msg) {
        let match = matches.find(channel => channel.id == msg.channel.id);
        if (!match) return sendMessage(msg, 'setup', 'not_created');
        if (match.owner != msg.author.id) return sendMessage(msg, 'error', 'denied');
        if (match.round > 0) return sendMessage(msg, 'setup', 'already_started');
        if (match.players < config.minPlayers) return sendMessage(msg, 'setup', 'missing_players');

        match.round++;

        match.players.forEach(player => {
            player.cards = [getCheckedRandomCard(match), getCheckedRandomCard(match)]
            player.cards.forEach(card => player.obj.sendFile(getCardFile(card)));
        });
        match.pot += config.blind*1.5;

        match.players[match.currentPlayer].cash -= config.blind/2;
        match.players[match.currentPlayer].call = config.blind/2;
        sendMessage(msg, 'info', 'small_blind', match.players[match.currentPlayer].obj.username, null, config.blind/2, match.pot);
        match.currentPlayer = (((match.currentPlayer + 1) % match.players.length) + match.players.length) % match.players.length;

        match.call = config.blind;
        match.players[match.currentPlayer].cash -= config.blind;
        match.players[match.currentPlayer].call = config.blind;
        sendMessage(msg, 'info', 'big_blind', match.players[match.currentPlayer].obj.username, null, config.blind, match.pot);
        match.currentPlayer = (((match.currentPlayer + 1) % match.players.length) + match.players.length) % match.players.length;


        bot.user.setGame(i18n.games.his_turn.replace(/{{.*}}/, match.players[match.currentPlayer].obj.username));
        return sendMessage(msg, 'info', 'his_turn', match.players[match.currentPlayer].obj.username);
    },
    stop(msg) {
        let match = matches.find(channel => channel.id == msg.channel.id);
        if (match.owner != msg.author.id) return sendMessage(msg, 'error', 'denied');
        if (!match) return sendMessage(msg, 'setup', 'not_created');
        matches.splice(matches.indexOf(match), 1);
    },
    join(msg) {
        let match = matches.find(channel => channel.id === msg.channel
            .id);
        if (!match) return sendMessage(msg, 'setup', 'not_created');
        if (match.round) return sendMessage(msg, 'setup', 'already_started');
        if (match.players.find(player => player.obj.id === msg.author.id)) return sendMessage(msg, 'setup', 'already_joined')
        match.players.push({
            obj: msg.author,
            cash: match.cash,
            state: 'join',
            call: 0,
            cards: []
        });
        return sendMessage(msg, 'info', 'player_joined', msg.author.username);
    },
    raise(msg, args) {
        let match = matches.find(channel => channel.id == msg.channel.id);
        if (!match) return sendMessage(msg, 'setup', 'not_started');

        if (match.players[match.currentPlayer].obj.id !== msg.author.id) return sendMessage(msg, 'setup', 'not_you_turn', match.players[match.currentPlayer].obj.username);

        const raise = parseInt(args[0]);

        if (!raise) return sendMessage(msg, 'setup', 'no_arg');
        if (match.players[match.currentPlayer].cash < raise) return sendMessage(msg, 'setup', 'no_money', match.players[match.currentPlayer].cash);
        if (raise < match.call * 2) return sendMessage(msg, 'setup', 'to_less_raise', match.call * 2);
        match.call = raise;

        match.pot += match.subRound ? match.call -
            match.players[match.currentPlayer].call :
            match.call;

        match.players[match.currentPlayer].cash += match.players[match.currentPlayer].call - match.call;

        match.players[match.currentPlayer].call = match.call;

        nextRound(match, msg);
        return sendMessage(msg, 'info', 'raise', match.players[match.currentPlayer].obj.username, null, match.call, match.pot);
    },
    call(msg) {
        let match = matches.find(channel => channel.id == msg.channel.id);
        if (!match) return sendMessage(msg, 'setup', 'not_started');

        if (match.players[match.currentPlayer].obj.id !== msg.author.id) return sendMessage(msg, 'setup', 'not_you_turn', match.players[match.currentPlayer].obj.username);
        if (match.call === 0) return sendMessage(msg, 'setup', 'call_null');
        if (match.players[match.currentPlayer].cash < match.call) return sendMessage(msg, 'setup', 'no_money', match.players[match.currentPlayer].cash);

        match.pot += match.subRound ? match.call -
            match.players[match.currentPlayer].call :
            match.call;

        match.players[match.currentPlayer].cash += match.players[match.currentPlayer].call - match.call;

        match.players[match.currentPlayer].call = match.call;

        nextRound(match, msg);
        //@TODO ???
        return sendMessage(msg, 'info', 'call', match.players[match.currentPlayer].obj.username, null, match.call, match.pot);
    },
    check(msg) {
        let match = matches.find(channel => channel.id == msg.channel.id);
        if (!match) return sendMessage(msg, 'setup', 'not_started');

        if (match.players[match.currentPlayer].obj.id !== msg.author.id) return sendMessage(msg, 'setup', 'not_you_turn', match.players[match.currentPlayer].obj.username);

        if (match.call !== 0) return sendMessage(msg, 'setup', 'call_not_null');
        match.call = 0;
        match.players[match.currentPlayer].call = 0;

        nextRound(match, msg);
        return sendMessage(msg, 'info', 'check', match.players[match.currentPlayer].obj.username, null, match.call, match.pot);
    },
    help(msg) { sendMessage(msg, 'info', 'help', {}, true); }
}

function nextRound(match, msg) {
    if (!match.players.some(player => player.call !== match.call)) {
        match.round++;
        match.currentPlayer = 1;
        match.call = 0;

        match.players.forEach(player => player.call = 0);
        for (let i = 0; i < (match.round === 2 ? 3 : 1); i++) {
            const card = getCheckedRandomCard(match);

            match.cards.push(card);

            msg.channel.sendFile(getCardFile(card));
        }
        sendMessage(msg, 'info', 'his_turn', match.players[match.currentPlayer].obj.username);
        return match.cards;
    }

    match.currentPlayer++;
    log(match.currentPlayer);
    if (match.currentPlayer >= match.players.length-1) {
        match.currentPlayer = 0;
        match.subRound = true;
    }//@TODO Check error
    for (; match.players[match.currentPlayer].state !== 'out'; match.currentPlayer++) {
        log(match.currentPlayer);
        if (match.players[match.currentPlayer].call !== match.call) {
            bot.user.setGame(i18n.games.his_turn.replace(/{{.*}}/, match.players[match.currentPlayer].obj.username));
            return sendMessage(msg, 'info', 'his_turn', match.players[match.currentPlayer].obj.username);
        }
        log(match.currentPlayer);
    }
}

function getCardName(card) {
    return `${(card.value > 10 ? highCards[(card.value % 10) - 1] : card.value)}_of_${card.type}`;
}

//generate a checked random card
function getCheckedRandomCard(match) {
    const cards = [...match.cards];

    match.players.forEach(player => cards.push(...player.cards));

    const types = [];

    cardTypes.forEach(type => {
        const cardsOfType = cards.filter(card => card.type ===
            type)
            .map(card => card.value);

        const cardType = {
            name: type,
            cards: Array.from(Array(13), (value, i) => i + 2).filter(item => !cardsOfType.includes(item))
        };

        if (cardType.cards.length)
            types.push(cardType);
    });

    const type = types[Math.floor(Math.random() * types.length)];
    const value = type.cards[Math.floor(Math.random() * type.cards.length)];

    return {
        type: type.name,
        value
    };
}

//get the crad file
function getCardFile(card) {
    return `./cards/${getCardName(card)}.png`;
}

function sendMessage(msg, type, tag, data, author, up, pot) {

    const embed = new Discord.RichEmbed();

    const color = i18n.messages[type].color;
    const text = i18n.messages[type].texts[tag];

    const title = text.title.replace(/{{.*}}/, data || '');
    if (!title) return;
    const description = text.description.replace('{{pot}}', pot || '').replace('{{up}}', up || '').replace('{{username}}', data || '').replace('{{money}}', data || '');
    log(title, description);
    embed.setTitle(title);
    embed.setDescription(description);
    embed.setColor(color);
    msg[author ? 'author' : 'channel'].sendEmbed(embed);
}

//log service
function log(msg) {
    console.log('[' + Math.round((new Date())
        .getTime() / 1000) + '] ', msg);
}
