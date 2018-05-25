/**
 * Stammtisch Bot
 * @version 3.0.0
 * @author Robin Seerig - https://cherob.eu/
 * @author Lukas Weber - https://www.astrogd.eu/
 * @since 2017-03-23
 * @static
 * Website: https://d-st.eu/
 */
const scriptName = 'index.js',
    version = '3.0.0';

// Required Modules and Files
const failsave = require(`${__dirname}/failsave.js`),
    Discord = require('discord.js'),
    i18n = require(`${__dirname}/data/i18n.json`),
    fs = require('fs'),
    config = require(`${__dirname}/data/config.json`);

// Defined  Instances 
const client = new Discord.Client();

// Function Pool
const fncP = require(`${__dirname}/functionPool.js`)(Discord, client, failsave.log);

// Required Scripts
const databaseManager = require(`${__dirname}/databaseManager.js`)(config, i18n, fncP),
    radioBot = require(`${__dirname}/radioBot.js`)(config, i18n, fncP, client, fs),
    ticketSystem = require(`${__dirname}/ticketSystem.js`)(config, i18n, fncP, client, fs),
    newPlayerDetector = require(`${__dirname}/newPlayerDetector.js`)(client, config, fncP, i18n),
    utility = require(`${__dirname}/utility.js`)(config, i18n, fncP, client, fs),
    moderation = require(`${__dirname}/moderation.js`)(config, i18n, fncP, client, fs),
    administration = require(`${__dirname}/administration.js`)(config, i18n, fncP, client, fs),
    violations = require(`${__dirname}/violations.js`)(config, i18n, fncP, client, fs),
    levelSystem = require(`${__dirname}/levelSystem.js`)(config, i18n, fncP);

// Main Function
failsave.start(client, () => {

    setInterval(function () {
        let dateCurrent = new Date();
        const timestampCurrent = `${dateCurrent.getFullYear()}-${dateCurrent.getMonth() + 1}-${dateCurrent.getDay()}-${dateCurrent.getHours()}-${dateCurrent.getMinutes()}-${dateCurrent.getSeconds()}`;

        //client.user.setActivity(timestampCurrent);
    }, 1000);

    client.on('message', async (message) => {
        if (message.content.split(' ')[0] == "debug-stop") return process.exit(28);

        newPlayerDetector.checkPlayer(message.author, "users");

        //if (message.author.id === client.user.id) return message.delete(config.auto_delete_time).catch(e => { }); Doofe Idee, weil unterschiedliche Befehle nach unterschiedlicher Zeit gelöscht werden sollen. --> Manuell im jeweiligen Code machen
        if (message.author.bot) return;
        if (!message.guild) return;

        // DM Commands
        if (message.guild.id != config.server_id) return;



        // Server Commands
        commandManager.catch(e => { });
    });

    client.on("guildMemberAdd", async (member) => {
        newPlayerDetector.check(member);
    });

    client.on("messageReactionAdd", async (reaction, user) => {
        if (user.bot) return;

        utility.messageReactionAdd(reaction, user);
        administration.messageReactionAdd(reaction, user);
    });

    client.on("channelDelete", async (channel) => {
        administration.channelDelete(channel);
    });

    client.on('ready', async () => {
        try {
            fncP.init(databaseManager);
            databaseManager.init(databaseManager);
            newPlayerDetector.init(databaseManager);
            levelSystem.init(databaseManager);
            //utility.init(databaseManager);
            //moderation.init();
            //ticketSystem.init(databaseManager);
            //administration.init(databaseManager);
            //violations.init(databaseManager);
            //radioBot.init(databaseManager);
            failsave.log(scriptName, 'All scripts were initialized successfully!');
        } catch (e) {
            failsave.log(scriptName, e, 2);
        }
    });

    client.on("guildMemberRemove", async (member) => {
        administration.guildMemberRemove(member);
    })

});

client.login(config.token);