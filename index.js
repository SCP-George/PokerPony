//import files and classes
const Discord = require('discord.js');
const config = require("./data/config.json");
const token = require("C:/Users/robin/OneDrive/Dokumente/GitHub/token.json");

//creation instance
const bot = new Discord.Client();

//get config
const ownerID = config.ownerID;

//define default letiables
const groundCardsDefault = {
    "card1": null,
    "card2": null,
    "card3": null,
    "card4": null,
    "card5": null
};
const cardsDefault = {
    "2_of_diamonds": 0,
    "2_of_hearts": 0,
    "2_of_spades": 0,
    "2_of_clubs": 0,

    "3_of_diamonds": 0,
    "3_of_hearts": 0,
    "3_of_spades": 0,
    "3_of_clubs": 0,

    "4_of_diamonds": 0,
    "4_of_hearts": 0,
    "4_of_spades": 0,
    "4_of_clubs": 0,

    "5_of_diamonds": 0,
    "5_of_hearts": 0,
    "5_of_spades": 0,
    "5_of_clubs": 0,

    "6_of_diamonds": 0,
    "6_of_hearts": 0,
    "6_of_spades": 0,
    "6_of_clubs": 0,

    "7_of_diamonds": 0,
    "7_of_hearts": 0,
    "7_of_spades": 0,
    "7_of_clubs": 0,

    "8_of_diamonds": 0,
    "8_of_hearts": 0,
    "8_of_spades": 0,
    "8_of_clubs": 0,

    "9_of_diamonds": 0,
    "9_of_hearts": 0,
    "9_of_spades": 0,
    "9_of_clubs": 0,

    "10_of_diamonds": 0,
    "10_of_hearts": 0,
    "10_of_spades": 0,
    "10_of_clubs": 0,

    "jack_of_diamonds": 0,
    "jack_of_hearts": 0,
    "jack_of_spades": 0,
    "jack_of_clubs": 0,

    "queen_of_diamonds": 0,
    "queen_of_hearts": 0,
    "queen_of_spades": 0,
    "queen_of_clubs": 0,

    "king_of_diamonds": 0,
    "king_of_hearts": 0,
    "king_of_spades": 0,
    "king_of_clubs": 0,

    "ace_of_diamonds": 0,
    "ace_of_hearts": 0,
    "ace_of_spades": 0,
    "ace_of_clubs": 0
};

//set public letiables
const gameInfos = {
    "round": -1,
    "pot": 0,
    "call": 0,
    "currentPlayer": 0,
    "subRound": false
}

/*
round:
-1 = wait for create
 0 = wait for players (created)
 1 = round started (first deal round)
 2 = turn start
 3 = flop start
 4 = river start
*/
let players = [];

//login with token
bot.login(token.myToken);

bot.on("ready", () => {
    bot.user.setGame("Poker!");
    log("");
    log("Bot loaded!");
});

bot.on("message", msg => {
    if (initMessage(msg) == false) { return; }
    let cmd = msg.content.split(" ")[0]; //get command

    // +-------------------+
    // |     COMMANDS      |
    // +-------------------+

    switch (cmd) {
        case "info":
            console.log("isOwner: " + (msg.author.id != ownerID));
            console.log("players: ");
            console.log(players);
            console.log("gameInfos: ");
            console.log(gameInfos);
            break;
        case "create":
            if (msg.author.id != ownerID) {
                accessDenied(msg);
                return;
            }
            if (gameInfos.round == -1) {
                createGame(msg);
                return;
            }
            setupEmbed("Es läuft bereits ein Spiel!");
            break;
        case "start":
            if (msg.author.id != ownerID) {
                accessDenied(msg);
                return;
            }
            if (gameInfos.round > 0) {
                setupEmbed("Es läuft bereits ein Spiel!");
                return;
            }
            if (gameInfos.round == -1) {
                setupEmbed("Achtung", "Es läuft aktuell keine Runde!", msg);
                return;
            }
            if (players.length >= 2) {
                startRound(msg);
                return;
            }
            setupEmbed("Mindestens 2 Spieler", players.length + "/2", msg);
            break;
        case "stop":
            if (msg.author.id != ownerID) {
                accessDenied(msg);
                return;
            }
            if (round != -1) {
                stopGame(msg);
                return;
            }
            setupEmbed("Achtung", "Es läuft aktuell keine Runde!", msg);
            break;
        case "join":
            if (gameInfos.round == 0) {
                join(msg);
                return;
            }
            setupEmbed("Achtung", "Es läuft aktuell keine Runde!", msg);
            break;
        case "clear":
            if (msg.author.id != ownerID) {
                accessDenied(msg);
                return;
            }
            if (msg.author.id == ownerID) {
                msg.channel.bulkDelete(100);
            }
            break;
        case "call":
            if (gameInfos.round < 1) {
                setupEmbed("Achtung", "Es läuft aktuell keine Runde!", msg);
                return;
            }
            if (players[gameInfos.currentPlayer].id != msg.author.id) {
                log(`${players[gameInfos.currentPlayer].username} ist grade dran!`);
                return;
            }
            callIt(msg);
            break;
        default:
            messageEmbed("Befehle ", "join | Runde beitreten \nready | Karten nehmen \ncall | Mitgehen \nraise <wert> | Erh\u00f6hen \ncheck | Passen (0 Runde) \ninfo | Info's halt.. \nfold | Aussteigen \nall-in | HALLT ALLES", msg);
            break;
    }
});

// +-------------------+
// |     FUNCTIONS     |
// +-------------------+

function callIt(msg) {
    let args = msg.content.split(" ").slice(1); //get arguments

    if (parseInt(args[0]) >= players[gameInfos.currentPlayer].cash) {
        setupEmbed("Du hast nicht genug Coins", "nutze \"all-in\"", msg);
        return;
    }
    let call = (args[0] === undefined) ? gameInfos.call : parseInt(args[0]);
    if (call === 0) {
        messageEmbed("Du kannst nicht \"0\" callen!", "nutze \"check\" oder \"call <wert>\"", msg);
        return;
    }
    if (call < gameInfos.call) {
        setupEmbed("Achtung", `Du must mindestens ${gameInfos.call} callen!`, msg);
        return; //@TODO return ^ this
    }
    gameInfos.call = call;

    gameInfos.pot += gameInfos.subRound ? gameInfos.call - players[gameInfos.currentPlayer].call : gameInfos.call;
    players[gameInfos.currentPlayer].cash += players[gameInfos.currentPlayer].call - gameInfos.call;
    players[gameInfos.currentPlayer].call = gameInfos.call;

    messageEmbed("Call", "+" + gameInfos.call + " Coins | (" + gameInfos.pot + " Coins)", msg);
    manageGame(msg);
}

function checkGame(msg) {
    const playersCount = players.length;
    if (gameInfos.currentPlayer >= (playersCount - 1)) gameInfos.subRound = true;
    if (gameInfos.subRound) {
        for (var i = 0; i < (playersCount); i++) {
            if (players[i].call != gameInfos.call) {
                gameInfos.currentPlayer = (i) - 1;
                return false;
            }
        }
    }
    return gameInfos.currentPlayer >= (obj.users.length - 1);
}


function manageGame(msg) {
    const playersCount = players.length;
    if (!players.some((player, index) => {
        return (player.call !== gameInfos.call);
    }
    )) {
        startRound(msg);
        roundFunctions[gameInfos.round-2](msg);
        return;
    }

    gameInfos.currentPlayer++;
    for (; gameInfos.currentPlayer < playersCount && players[gameInfos.currentPlayer].state === "out"; gameInfos.currentPlayer++) {
        if (players[gameInfos.currentPlayer].call === gameInfos.call) {
            bot.user.setGame(players[gameInfos.currentPlayer].username + " ist dran!");
            messageEmbed(players[gameInfos.currentPlayer].username, "Ist an der Reihe", msg);
            return;
        }
        if (gameInfos.currentPlayer >= playersCount) {
            gameInfos.currentPlayer = 0;
            gameInfos.subRound = true;
        }
    }
}

function getCards(msg) {
    card1 = getCheckedRandomCard();
    card2 = getCheckedRandomCard();
    msg.author.sendMessage("Deine Karten:");
    msg.author.sendFile(getCardFile(card1));
    msg.author.sendFile(getCardFile(card2));
    for (let i = 0; i < (players.length); i++) {
        if (players[i].id == msg.author.id) {
            players[i].card1 = card1;
            players[i].card2 = card2;
            return;
        }
    }
    return;
}

//#region ----- CARD    OPERATIONS -----

const roundFunctions = [
    //show the flop
    function flop(msg) {
        card = getCheckedRandomCard();
        groundCards.card1 = card;
        msg.channel.sendFile(getCardFile(card));

        card = getCheckedRandomCard();
        groundCards.card2 = card;
        msg.channel.sendFile(getCardFile(card));

        card = getCheckedRandomCard();
        groundCards.card3 = card;
        msg.channel.sendFile(getCardFile(card));
    },

    //show the trun
    function turn(msg) {
        card = getCheckedRandomCard();
        groundCards.card4 = card;
        msg.channel.sendFile(getCardFile(card));
    },

    //show the river
    function river(msg) {
        card = getCheckedRandomCard();
        groundCards.card5 = card;
        msg.channel.sendFile(getCardFile(card));
    }

];

//generate an random card
function getRandomCard() {
    let value = Math.floor(Math.random() * (14 - 2 + 1)) + 2;
    let color = Math.floor(Math.random() * (1 - 4 + 1)) + 4;
    let cardValue;
    if (value == "11") { cardValue = "jack" }
    else if (value == "12") { cardValue = "queen" }
    else if (value == "13") { cardValue = "king" }
    else if (value == "14") { cardValue = "ace" }
    else { cardValue = value; }

    if (color == "1") { cardColor = "diamonds" }
    else if (color == "2") { cardColor = "hearts" }
    else if (color == "3") { cardColor = "spades" }
    else if (color == "4") { cardColor = "clubs" }

    let cardName = cardValue + "_of_" + cardColor;
    return cardName;
}

//generate a checked random card
function getCheckedRandomCard() {
    let cardName = getRandomCard();
    if (cards[cardName] == 0) {
        cards[cardName] = 1;
        return cardName;

    } else {
        while (true) {
            if (cards[cardName] == 0) {
                cards[cardName] = 1;
                return cardName;
            } else {
                let cardName = getRandomCard();
            }
        }
    }

}

//get the crad file
function getCardFile(n) {
    return "./cards/" + n + ".png";
}

//get card text
function getCardText(card) {
    let texts = (card + "").split("_")
    let text = texts[0] + " of " + texts[2]
    return text;
}

//#endregion
//#region ----- PLAYER  OPERATIONS -----

function join(msg) {
    for (let i = 0; i < (players.length); i++) {
        if (players[i].id == msg.author.id) {
            setupEmbed("Achtung", "Du bist bereits beigetreten", msg);
            return;
        }
    }
    messageEmbed(":spades: " + msg.author.username, "ist beigetreten", msg);
    players.push({ "username": msg.author.username, "id": msg.author.id, "msgObj": msg, "cash": config.startAmount, "state": "join", "call": 0, "card1": "", "card2": "" });
    return;
}

function check(msg) {
    if (gameInfos.round == -1) {
        setupEmbed("Keine laufende Runde", "", msg);
        return false;
    }
    if (players[gameInfos.currentPlayer].username != msg.author.username) {
        messageEmbed(players[gameInfos.currentPlayer].username, "ist an der Reihe", msg);
        return false;
    }
    return true;
}

//check is player is in game
function isInGame(msg) {
    for (let i = 0; i < (players.length); i++) {
        if (players[i].id == msg.author.id) {
            return false;
        }
    }
    return true;
}

//#endregion
//#region ----- SETUP   OPERATIONS -----

//pre-checks the message
function initMessage(msg) {
    if (msg.channel.id != config.channelID) {
        return false;
    }    //check if right channel
    if (msg.author.bot) {                                 //check if not him self
        if (msg.embeds[0].title.includes(":spades:")) {   //check if message is tagged
            return false;
        }
        msg.delete(config.deleteTime);
        return false;
    }
    msg.delete();
    log(msg.author.username + "(" + msg.author.id + "): " + msg.content);
    return true;
}

//start the round
function startRound(msg) {
    gameInfos.round++;
    groundCards = groundCardsDefault;
    cards = cardsDefault;
    for (let i = 0; i < (players.length); i++) {
        getCards(players[i].msgObj);
    }
    bot.user.setGame(players[gameInfos.currentPlayer].username + " ist dran!");
    messageEmbed(players[gameInfos.currentPlayer].username, "Ist an der Reihe", msg);
}

function nextRound(msg){
    gameInfos.round++;
    cards = cardsDefault;
    bot.user.setGame(players[gameInfos.currentPlayer].username + " ist dran!");
    messageEmbed(players[gameInfos.currentPlayer].username, "Ist an der Reihe", msg);
}

//stop the round
function roundEnd() {
    gameInfos.round++;
}

//start a new game
function createGame(msg) {
    players = [];
    msg.channel.bulkDelete(100);
    messageEmbed(":spades: Spiel gestartet", "von " + msg.author.username, msg);
    players.push({ "username": msg.author.username, "id": msg.author.id, "msgObj": msg, "cash": config.startAmount, "state": "dealer", "call": 0, "card1": "", "card2": "" });
    gameInfos.round = 0;
    gameInfos.currentPlayer = 0;
}

//stop the game
function stopGame(msg) {
    log("Stop Game!");
    setupEmbed("Runde gestoppt", "von " + msg.author.username, msg);
    players = [];
    cards = {};
    groundCards = {};
    gameInfos.currentPlayer = 0;
    gameInfos.round = -1;
}

//#endregion
//#region ----- MESSAGE OPERATIONS -----


//message service
function messageEmbed(t, d, msg) {
    log(t, d);
    let embedPoker = new Discord.RichEmbed();
    embedPoker.setTitle(t);
    embedPoker.setDescription(d);
    embedPoker.setColor("#55FF55");
    msg.channel.sendEmbed(embedPoker);
}

//message service
function setupEmbed(t, d, msg) {
    log(t, d);
    let embedPoker = new Discord.RichEmbed();
    embedPoker.setTitle(t);
    embedPoker.setDescription(d);
    embedPoker.setColor("#FFB700");
    msg.channel.sendEmbed(embedPoker);
}

//message service
function accessDenied(msg) {
    log(t, d);
    let embedPoker = new Discord.RichEmbed();
    embedPoker.setTitle("Verweigert!");
    embedPoker.setDescription(msg.author.username + ", du hast keine Rechte dafür.");
    embedPoker.setColor("#FF0000");
    msg.channel.sendEmbed(embedPoker);
}

//log service
function log(...msg) {
    console.log("[" + Math.round((new Date()).getTime() / 1000) + "] ", ...msg);
}

//#endregion
