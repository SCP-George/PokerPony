//import files and classes
const Discord = require('discord.js');
const config = require("./data/config.json");
const token = require("./data/token.json");

//creation instance
const bot = new Discord.Client();

//get config
const ownerID = config.ownerID;

//define default variables
const playersDefault = {
    "master": "", "users": []
};
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

//set public variables
var players;
var cards;
var groundCards;
var currentPlayer;
var round = -1;

//login with token
bot.login(token.myToken);

bot.on("ready", () => {
    bot.user.setGame("Poker!");
    var deleteAllCards = false;
    cards = cardsDefault;
    log("bot loaded!");
});

bot.on("message", msg => {
    if(msg.channel.id != config.channelID) {return;}
    if(msg.author.bot){
        if(msg.embeds[0].title.includes(":spades:")){
            return;
        }
        msg.delete(config.deleteTime); return;
    }
    msg.delete();
    var cmd = msg.content;

    log(msg.author.username + ": " + msg.content);

    // +-------------- ----+
    // |     COMMANDS      |
    // +-------------------+

    //start the game
    if(cmd == "start") {
        log("kp warum");
        if (round == 0) {
            gameStart(msg);
            return;
        }
        newEmbed("Bereits laufende Runde", "", msg);
        return;
    }

    //remove all recent messages
    if (cmd == "clear") {
        if(msg.author.id == ownerID){
          msg.channel.bulkDelete(100);
        }
        return;
    }

    return;

});

// +-------------------+
// |     FUNCTIONS     |
// +-------------------+

//----- CARD OPERATIONS -----

//show the flop
function flop(msg){
    card = getCheckedRandomCard();
    groundCards.card1 = card;
    msg.channel.sendFile(getCardFile(card));

    card = getCheckedRandomCard();
    groundCards.card2 = card;
    msg.channel.sendFile(getCardFile(card));

    card = getCheckedRandomCard();
    groundCards.card3 = card;
    msg.channel.sendFile(getCardFile(card));
}

//show the trun
function turn(msg){
    card = getCheckedRandomCard();
    groundCards.card4 = card;
    msg.channel.sendFile(getCardFile(card));
}

//show the river
function river(msg){
    card = getCheckedRandomCard();
    groundCards.card5 = card;
    msg.channel.sendFile(getCardFile(card));
}

//generate an random card
function getRandomCard() {
    var value = Math.floor(Math.random() * (14 - 2 +1)) + 2;
    var color = Math.floor(Math.random() * (1 - 4 +1)) + 4;
    var cardValue;
    if(value == "11"){cardValue = "jack"}
    else if(value == "12"){cardValue = "queen"}
    else if(value == "13"){cardValue = "king"}
    else if(value == "14"){cardValue = "ace"}
    else {cardValue = value;}

    if(color == "1"){cardColor = "diamonds"}
    else if(color == "2"){cardColor = "hearts"}
    else if(color == "3"){cardColor = "spades"}
    else if(color == "4"){cardColor = "clubs"}

    var cardName = cardValue+"_of_"+cardColor;
    return cardName;
}

//generate a checked random card
function getCheckedRandomCard(){
    var cardName = getRandomCard();
    if (cards[cardName] == 0) {
        cards[cardName] = 1;
        return cardName;

    } else {
        while (true) {
            if (cards[cardName] == 0) {
                cards[cardName] = 1;
                return cardName;
            } else {
                var cardName = getRandomCard();
            }
        }
    }

}

//get the crad file
function getCardFile(n){
    return "./cards/"+n+".png";
}

//get card text
function getCardText(card){
    var texts = (card + "").split("_")
    var text = texts[0] + " of " + texts[2]
    return text;
}

//----- PLAYER OPERATIONS -----

function join(msg){
    for (var i = 0; i < (players.users.length); i++) {
        if (players.users[i].id == msg.author.id) {
            newEmbed("Achtung", "Du bist beteits beigetreten", msg);
            return;
        }
    }
    newEmbed(":spades: " + msg.author.username, "ist beigetreten", msg);
    players['users'].push({
        "username": msg.author.username,
        "id": msg.author.id,
        "cash": config.startCash,
        "state": "join",
        "call": 0 ,
        "card1":"",
        "card2":""});
    return;
}

function check(msg){
    if(round == -1){
        newEmbed("Keine laufende Runde", "", msg);
        return false;
    }
    if (players.users[currentPlayer].username != msg.author.username) {
        newEmbed(players.users[currentPlayer].username, "Ist an der Reihe", msg);
        return false;
    }
    return true;
}

//----- SETUP OPERATIONS -----

//start the round
function roundStart(){
    round = 0;
    cards = cardsDefault;
    players = playersDefault;
    groundCards = groundCardsDefault;
}

//stop the round
function roundEnd(){
    var deleteAllCards = true;
    var round = -1;
}

//start a new game
function startGame(msg){
    roundStart();
    newEmbed(":spades: Runde gestartet", "von " + msg.author.username, msg);
    players['users'].push({"username": msg.author.username, "id": msg.author.id, "cash": config.startCash, "state": "dealer", "call": 0, "card1": "", "card2": ""});
    currentPlayer = 0;
    players.master = msg.author.id;
    return;
}

//----- MESSAGE OPERATIONS -----

//message service
function newEmbed(t, d, msg) {
    var embedPoker = new Discord.RichEmbed();
    embedPoker.setTitle(t);
    embedPoker.setDescription(d);
    embedPoker.setColor("#FFB700");
    msg.channel.sendEmbed(embedPoker);
}

//log service
function log(msg){
    console.log("["+Math.round((new Date()).getTime() / 1000)+"] "+msg);
}
