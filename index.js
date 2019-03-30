//paramètres globaux
const yourID = "328973921653227542"; 
const setupCMD = "~messagerole"
let initialMessage = `**Réagis au messages ci-dessous pour recevoir le rôle.**`;
const roles = ["Civil"];
const reactions = ["💻"];





                     console.log("J'ai démarré fréro");

//Load le bot
const Discord = require('discord.js');
const bot = new Discord.Client();
export const BOT_TOKEN = process.env.BOT_TOKEN;

//message d'erreur si:
if (roles.length !== reactions.length) throw "La liste des rôles et la liste des réactions ne sont pas de la même longueur !";

//générer le message selon mes paramètres
function generateMessages(){
    var messages = [];
    messages.push(initialMessage);
    for (let role of roles) messages.push(`En réagissant avec 💻, tu affirmes avoir pris connaissance des règles du serveur.  **"${role}"**`); //DONT CHANGE THIS
    return messages;
}


bot.on("message", message => {
    if (message.author.id == yourID && message.content.toLowerCase() == setupCMD){
        var toSend = generateMessages();
        let mappedArray = [[toSend[0], false], ...toSend.slice(1).map( (message, idx) => [message, reactions[idx]])];
        for (let mapObj of mappedArray){
            message.channel.send(mapObj[0]).then( sent => {
                if (mapObj[1]){
                  sent.react(mapObj[1]);  
                } 
            });
        }
    }
})


bot.on('raw', event => {
    if (event.t === 'MESSAGE_REACTION_ADD' || event.t == "MESSAGE_REACTION_REMOVE"){
        
        let channel = bot.channels.get(event.d.channel_id);
        let message = channel.fetchMessage(event.d.message_id).then(msg=> {
        let user = msg.guild.members.get(event.d.user_id);
        
        if (msg.author.id == bot.user.id && msg.content != initialMessage){
       
            var re = `\\*\\*"(.+)?(?="\\*\\*)`;
            var role = msg.content.match(re)[1];
        
            if (user.id != bot.user.id){
                var roleObj = msg.guild.roles.find(r => r.name === role);
                var memberObj = msg.guild.members.get(user.id);
                
                if (event.t === "MESSAGE_REACTION_ADD"){
                    memberObj.addRole(roleObj)
                } else {
                    memberObj.removeRole(roleObj);
                }
            }
        }
        })
 
    }   
    
});

// Paramètres
const prefix = '~'; 

// vite fait 
bot.on('message', message => {

    // Variable
    let msg = message.content.toUpperCase(); 
    let sender = message.author; 
    let cont = message.content.slice(prefix.length).split(" ");
    let args = cont.slice(1); 

    // Commandes

    // Ping
    if (msg === prefix + 'PING') { 

        
        message.channel.send('Ping!');

    }


    // Purge
    if (msg.startsWith(prefix + 'PURGE')) { 
        
        async function purge() {
            message.delete(); 

            
            if (!message.member.roles.find("name", "Admin")) { 
                message.channel.send('You need the \`Admin\` role to use this command.'); 
                return; 
            }

          
            if (isNaN(args[0])) {
               
                message.channel.send('Please use a number as your arguments. \n Usage: ' + prefix + 'purge <amount>');
                
                return;
            }

            const fetched = await message.channel.fetchMessages({limit: args[0]}); 
            console.log(fetched.size + ' messages found, deleting...'); 

          
            message.channel.bulkDelete(fetched)
                .catch(error => message.channel.send(`Error: ${error}`)); 

        }

       
        purge(); 

    }
});


const { Client, Util } = require('discord.js');
const { TOKEN, PREFIX, GOOGLE_API_KEY } = require('./config');
const YouTube = require('simple-youtube-api');
const ytdl = require('ytdl-core');

const client = new Client({ disableEveryone: true });

const youtube = new YouTube(GOOGLE_API_KEY);

const queue = new Map();

client.on('warn', console.warn);

client.on('error', console.error);

client.on('ready', () => console.log('Yo this ready!'));

client.on('disconnect', () => console.log('I just disconnected, making sure you know, I will reconnect now...'));

client.on('reconnecting', () => console.log('I am reconnecting now!'));

client.on('message', async msg => { // eslint-disable-line
	if (msg.author.bot) return undefined;
	if (!msg.content.startsWith(PREFIX)) return undefined;

	const args = msg.content.split(' ');
	const searchString = args.slice(1).join(' ');
	const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	const serverQueue = queue.get(msg.guild.id);

	let command = msg.content.toLowerCase().split(' ')[0];
	command = command.slice(PREFIX.length)

	if (command === 'play') {
		const voiceChannel = msg.member.voiceChannel;
		if (!voiceChannel) return msg.channel.send('Je suis désolé, mais vous avez besoin d\'être dans un canal vocal pour jouer de la musique !');
		const permissions = voiceChannel.permissionsFor(msg.client.user);
		if (!permissions.has('CONNECT')) {
			return msg.channel.send('Je ne peux pas me connecter à votre salon vocal, assurez-vous que j\'ai les permissions appropriées !');
		}
		if (!permissions.has('SPEAK')) {
			return msg.channel.send('Je ne peux pas parler sur ce canal vocal, assurez-vous que j\'ai les bonnes permissions !');
		}

		if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
			return msg.channel.send(`✅ Playlist: **${playlist.title}** a été ajouté à la file d'attente !`);
		} else {
			try {
				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 10);
					let index = 0;
					msg.channel.send(`
__**Séléction de chansons**__
${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')}
Veuillez fournir une valeur pour sélectionner l'un des résultats de recherche allant de 1 à 10.
					`);
					
					try {
						var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
							maxMatches: 1,
							time: 10000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return msg.channel.send('Aucune valeur saisie ou valeur invalide, annulant la sélection vidéo.');
					}
					const videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send('🆘 Je n\'ai obtenu aucun résultat de recherche.');
				}
			}
			return handleVideo(video, msg, voiceChannel);
		}
	} else if (command === 'skip') {
		if (!msg.member.voiceChannel) return msg.channel.send('Vous n\'êtes pas dans un salon vocal !');
		if (!serverQueue) return msg.channel.send('Il n\'y a rien que je puisse skipper pour toi.');
		serverQueue.connection.dispatcher.end('La commande skip a été utilisée');
		return undefined;
	} else if (command === 'stop') {
		if (!msg.member.voiceChannel) return msg.channel.send('Vous n\'êtes pas dans un salon vocal !');
		if (!serverQueue) return msg.channel.send('Il n\'y a rien que je puisse stopper pour toi.');
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end('La commande stop a été utilisée');
		return undefined;
	} else if (command === 'volume') {
		if (!msg.member.voiceChannel) return msg.channel.send('Vous n\'êtes pas dans un salon vocal');
		if (!serverQueue) return msg.channel.send('There is nothing playing.');
		if (!args[1]) return msg.channel.send(`Le volume actuel est de: **${serverQueue.volume}**`);
		serverQueue.volume = args[1];
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 5);
		return msg.channel.send(`J'ai réglé le volume sur: **${args[1]}**`);
	} else if (command === 'np') {
		if (!serverQueue) return msg.channel.send('Il n\'y a rien à jouer.');
		return msg.channel.send(`🎶 Now playing: **${serverQueue.songs[0].title}**`);
	} else if (command === 'queue') {
		if (!serverQueue) return msg.channel.send('Il n\'y a rien à jouer.');
		return msg.channel.send(`
__**Musiques en file d'attente:**__
${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}
**En train de jouer:** ${serverQueue.songs[0].title}
		`);
	} else if (command === 'pause') {
		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			return msg.channel.send('⏸ La musique a été mis en pause pour toi!');
		}
		return msg.channel.send('Il n\'y a rien à jouer');
	} else if (command === 'resume') {
		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			return msg.channel.send('▶ La musique a été reprise pour toi!');
		}
		return msg.channel.send('Il n\'y a rien à jouer');
	}

	return undefined;
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	console.log(video);
	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`Je ne peux pas rejoindre le salon vocal: ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`Je ne peux pas rejoindre le salon vocal: ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return undefined;
		else return msg.channel.send(`✅ **${song.title}** a été ajouté à la file d'attente`);
	}
	return undefined;
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	console.log(serverQueue.songs);

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === 'Le flux n\'est pas assez rapide.') console.log('La chanson s\'est terminée.');
			else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	serverQueue.textChannel.send(`🎶 J'ai lancé la musique: **${song.title}**`);
}

client.login(process.env.BOT_TOKEN);
