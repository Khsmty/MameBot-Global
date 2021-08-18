require('dotenv').config()

const { Client, Intents, MessageEmbed } = require('discord.js')
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_WEBHOOKS,
  ],
})

const chsend = (wh, data) => {
  wh.send({
    content: data.content,
    username: data.userTag,
    avatarURL: data.userAvatar,
    files: data.attachments,
    embeds: data.embeds,
  })
}

const newwh = (ch) =>
  ch.createWebhook('MameHook', {
    avatar: client.user.displayAvatarURL(),
  })

const newmsg = (msg) => {
  client.channels.cache.get('861526151096696832').send(
    JSON.stringify({
      type: 'message',
      content: msg.content,
      messageId: msg.id,
      channelId: msg.channel.id,
      channelName: msg.channel.name,
      userId: msg.author.id,
      userTag: msg.author.tag,
      userAvatar: msg.author.displayAvatarURL(),
      guildId: msg.guild.id,
      guildName: msg.guild.name,
      guildIcon: msg.guild.iconURL(),
      attachments: msg.attachments.map((a) => a.url),
    }),
  )
}

client
  .once('ready', () => console.log(`${client.user.tag} でログインしました。`))
  .on('messageCreate', async (message) => {
    if (!message.guild) return

    if (message.channelId === '861526151096696832') {
      const data = JSON.parse(message.content)

      if (data.type === 'join') {
        data.userAvatar = data.guildIcon
        data.userTag = data.guildName
        data.embeds = [
          new MessageEmbed()
            .setTitle('新規参加')
            .setDescription(
              `**${data.guildName}** がハイパーグローバルチャットに参加しました！`,
            )
            .setColor('#3F6791'),
        ]
        data.content = null
      } else if (data.type === 'announce') {
        data.userTag = 'HGCシステム'
        data.embeds = [
          new MessageEmbed()
            .setTitle('お知らせ')
            .setDescription(data.content)
            .setColor('#3F6791'),
        ]
        data.content = null
      }

      client.channels.cache
        .filter(
          (ch) =>
            ch.id !== data.channelId && ch.type === 'GUILD_TEXT' && ch.topic,
        )
        .filter((ch) => ch.topic.match(/mamebot-hgc/i))
        .forEach((ch) => {
          ch.fetchWebhooks().then((wh) => {
            const webhook = wh
              .filter((a) => a.owner.id === client.user.id)
              .first()

            if (webhook) chsend(webhook, data)
            else newwh(ch).then((wh) => chsend(wh, data))
          })
        })
    } else if (
      message.channel.topic &&
      message.channel.topic.match(/mamebot-hgc/i)
    ) {
      if (message.author.bot) return

      message.channel.fetchWebhooks().then((wh) => {
        const webhook = wh
          .filter((a) => a.owner.id === message.client.user.id)
          .first()

        if (webhook) {
          newmsg(message)
        } else {
          newwh(message.channel)
          client.channels.cache.get('861526151096696832').send(
            JSON.stringify({
              type: 'join',
              channelId: message.channel.id,
              channelName: message.channel.name,
              guildId: message.guild.id,
              guildName: message.guild.name,
              guildIcon: message.guild.iconURL(),
            }),
          )
          newmsg(message)
        }
      })

      const compReact = await message.react('845330856100757535')
      setTimeout(() => compReact.remove(), 5000)
    }
  })

client.login(process.env.DISCORD_TOKEN)
