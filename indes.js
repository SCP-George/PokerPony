//import files and classes
const Discord = require('discord.js');
const config = require("./data/config.json");
const token = require("C:/Users/robin/OneDrive/Dokumente/GitHub/token.json");

//creation instance
const bot = new Discord.Client();

//get config
const ownerID = config.ownerID;

//define default variables
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
var round = -1;
var dealCards = false;

//login with token
bot.login(token.myToken);

bot.on("ready", () => {
    bot.user.setGame("Poker!");
    log("Bot loaded!");
});

function initMessage(msg){
  if(msg.channel.id != config.channelID) {
    return false;
  }    //check if right channel
  if(msg.author.bot){                                 //check if not him self
      if(msg.embeds[0].title.includes(":spades:")){   //check if message is tagged
          return false;
      }
      msg.delete(config.deleteTime);
      return false;
  }
  msg.delete();
  log(msg.author.username + "("+msg.author.id+"): " + msg.content);
  return true;
}

bot.on("message", msg => {
    if(initMessage(msg) == false){return;}

    // +-------------------+
    // |     COMMANDS      |
    // +-------------------+

    //info of game
    if(msg.content == "info") {
        console.log("isOwner: "+ (msg.author.id != ownerID));
        console.log("round: "+ round);
        console.log("players: "+ players['users'].length);
        console.log("players: ");
        console.log(players['users']);
        console.log("players: ");
        console.log(players);
    }

    //create the game
    if(msg.content == "create") {
        if (msg.author.id != ownerID){
          accessDenied(msg);
          return;
        }
        if (round == -1) {
            startGame(msg);
            return;
        }
        setupEmbed("Es läuft bereits ein Spiel!")
        return;
    }

    //start the game
    if(msg.content == "start") {
        if (msg.author.id != ownerID){
          accessDenied(msg);
          return;
        }
        if (round > 0) {
          setupEmbed("Es läuft bereits ein Spiel!");
          return;
        }
        if (round == -1){
          setupEmbed("Achtung", "Es läuft aktuell keine Runde!", msg);
          return;
        }
        if(players['users'].length >= 2){
            roundStart(msg);
            return;
        }
        setupEmbed("Mindestens 2 Spieler", players['users'].length+"/2", msg);
        return;
    }

    //stop the game
    if(msg.content == "stop") {
        if (msg.author.id != ownerID){
          accessDenied(msg);
          return;
        }
        if (round != -1) {
            stopGame(msg);
            return;
        }
        setupEmbed("Achtung", "Es läuft aktuell keine Runde!", msg);
        return;
    }

    //start the game
    if(msg.content == "join") {
        if (round == 0) {
            join(msg);
            getCards(msg);
        }
        setupEmbed("Achtung", "Es läuft aktuell keine Runde!", msg);
        return;
    }

    //remove all recent messages
    if (msg.content == "clear") {
        if (msg.author.id != ownerID){
          accessDenied(msg);
          return;
        }
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

function manageGame(msg){
  players = players['users'].length;
}

function getCards(msg) {
    card1 = getCheckedRandomCard();
    card2 = getCheckedRandomCard();
    msg.author.sendMessage("Deine Karten:");
    msg.author.sendFile(getCardFile(card1));
    msg.author.sendFile(getCardFile(card2));
    for (var i = 0; i < (obj.users.length); i++) {
        if (players['users'][i].id == msg.author.id) {
            players['users'][i].card1 = card1;
            players['users'][i].card2 = card2;
            return;
        }
    }
    return;
}


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
    for (var i = 0; i < (players['users'].length); i++) {
        if (players['users'][i].id == msg.author.id) {
            setupEmbed("Achtung", "Du bist bereits beigetreten", msg);
            return;
        }
    }
    messageEmbed(":spades: " + msg.author.username, "ist beigetreten", msg);
    players['users'].push({"username": msg.author.username,"id": msg.author.id,"cash": config.startAmount,"state": "join","call": 0 ,"card1":"","card2":""});
    return;
}

function check(msg){
    if(round == -1){
        setupEmbed("Keine laufende Runde", "", msg);
        return false;
    }
    if (players['users'][currentPlayer].username != msg.author.username) {
        messageEmbed(players['users'][currentPlayer].username, "ist an der Reihe", msg);
        return false;
    }
    return true;
}

//check is player is in game
function isInGame(msg){
  for (var i = 0; i < (players['users'].length); i++) {
      if (players['users'][i].id == msg.author.id) {
          return false;
      }
  }
  return true;
}

//----- SETUP OPERATIONS -----

//start the round
function roundStart(msg){
    round++;
    groundCards = groundCardsDefault;
    cards = cardsDefault;
    getCards(msg);
    dealCards = true;
}

//stop the round
function roundEnd(){
    dealCards = false;
    round++;
}

//start a new game
function startGame(msg){
    players = {
      "users": []
    };
    while(!isInGame(msg)){
      players = {
        "users": []
      };
      delete players['users'];
      players = {
        "users": []
      };
    }
    msg.channel.bulkDelete(100);
    messageEmbed(":spades: Spiel gestartet", "von " + msg.author.username, msg);
    players['users'].push({"username": msg.author.username, "id": msg.author.id, "cash": config.startAmount, "state": "dealer", "call": 0, "card1": "", "card2": ""});
    round = 0;
    currentPlayer = 0;
    return;
}

//stop the game
function stopGame(msg){
    log("Stop Game!");
    setupEmbed("Runde gestoppt", "von " + msg.author.username, msg);
    players = {};
    cards = {};
    groundCards = {};
    currentPlayer = 0;
    round = -1;
    return;
}

//----- MESSAGE OPERATIONS -----


//message service
function messageEmbed(t, d, msg) {
    var embedPoker = new Discord.RichEmbed();
    embedPoker.setTitle(t);
    embedPoker.setDescription(d);
    embedPoker.setColor("#55FF55");
    msg.channel.sendEmbed(embedPoker);
}

//message service
function setupEmbed(t, d, msg) {
    var embedPoker = new Discord.RichEmbed();
    embedPoker.setTitle(t);
    embedPoker.setDescription(d);
    embedPoker.setColor("#FFB700");
    msg.channel.sendEmbed(embedPoker);
}

//message service
function accessDenied(msg) {
    var embedPoker = new Discord.RichEmbed();
    embedPoker.setTitle("Verweigert!");
    embedPoker.setDescription(msg.author.username + ", du hast keine Rechte dafür.");
    embedPoker.setColor("#FF0000");
    msg.channel.sendEmbed(embedPoker);
}

//log service
function log(msg){
    console.log("["+Math.round((new Date()).getTime() / 1000)+"] "+msg);
}
