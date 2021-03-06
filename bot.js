const { Telegraf, session } = require('telegraf')
const axios = require('axios');
const md5 = require('md5');

const token = process.env.BOT_TOKEN;
const groupChatId = process.env.GROUP_ID;
const base = `https://api.telegram.org/bot${token}`;

const bot = new Telegraf(token)
bot.use(session({
  getSessionKey: (ctx) => ctx.chat ? ctx.chat.id : '',
}))


const isFromEruditos = (ctx) => {
	// return ctx.update.message.chat.id === groupChatId;
	return true;
}

const replyIfRepost = async (ctx, m) => {
	try {
		const hash = md5(m);
		if (!ctx.session)
			ctx.session = {md5s: []};
		if (ctx.session.md5s.indexOf(hash) !== -1) {
			const {message_id} = ctx.message;
			return ctx.reply('Es repetido puñeeeetas 🎶', {reply_to_message_id: message_id});
		}
		ctx.session.md5s.push(hash);	
	} catch (err) {
		console.error(err);
	}
}

bot.start((ctx) => ctx.reply('Welcome'))
bot.on('text', (ctx) => {
	if (!isFromEruditos(ctx)) return;
	const {text} = ctx.update.message;
	const ix = text.indexOf('http');
	if (ix === -1) return;
	const url = text.slice(ix).split(' ')[0];
	replyIfRepost(ctx, url);
})
bot.on('photo', async (ctx) => {
	try {
		if (!isFromEruditos(ctx)) return;
		const {file_id} = ctx.update.message.photo.pop();
		const {data} = await axios.get(`${base}/getFile`, {params: {file_id:file_id}});
		const photo = await axios.get(`https://api.telegram.org/file/bot${token}/${data.result.file_path}`);
		replyIfRepost(ctx, photo.data);
	} catch (err) {
		console.error('fack', err);
	}
})
bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))