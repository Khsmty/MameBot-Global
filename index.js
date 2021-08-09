const http = require('http')
http
  .createServer(function (req, res) {
    res.write('OK')
    res.end()
  })
  .listen(8080)

const { Client, Intents, MessageEmbed } = require('discord.js')
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS |
      Intents.FLAGS.GUILD_WEBHOOKS |
      Intents.FLAGS.GUILD_MESSAGES,
  ],
})

client.once('ready', (message) => {
  console.log('Ready!')
})

client.on('messageCreate', (message) => {
  if (message.channel.topic === 'mamebot-hgc') {
    if (message.author.bot) return

    if (
      message.content.match(
        /discord\.gg|discord.com\/invite|discordapp.com\/invite|@everyone|@here|<@|<!@|<&@/g,
      )
    )
      return message.reply('利用できない文字が含まれています。')

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

    message.react('845330856100757535')
  }

  if (message.channel.id === '861526151096696832') {
    if (!message.author.bot) return

    const data = JSON.parse(message.content)

    if (data.type === 'join') {
      data.embeds = [
        new MessageEmbed()
          .setTitle('新規参加')
          .setDescription(
            `**${data.guildName}** がハイパーグローバルチャットに参加しました！`,
          )
          .setColor('#3F6791'),
      ]
    } else if (data.type === 'announce') {
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
          ch.topic === 'mamebot-hgc' &&
          ch.type === 'text' &&
          ch.id !== data.channelId,
      )
      .forEach((ch) => {
        ch.fetchWebhooks().then((wh) => {
          const webhook = wh
            .filter((a) => a.owner.id === message.client.user.id)
            .first()

          if (webhook) {
            chsend(webhook, data)
          } else {
            newwh(ch).then((wh) => chsend(wh, data))
          }
        })
      })

    message.react('845330856100757535')
  }
})

client.login(process.env.DISCORD_TOKEN)

function newmsg(message) {
  client.channels.cache.get('861526151096696832').send(
    JSON.stringify({
      type: 'message',
      content: message.content,
      messageId: message.id,
      channelId: message.channel.id,
      channelName: message.channel.name,
      userId: message.author.id,
      userTag: message.author.tag,
      userAvatar: message.author.displayAvatarURL(),
      guildId: message.guild.id,
      guildName: message.guild.name,
      guildIcon: message.guild.iconURL(),
      attachments: message.attachments.map((a) => a.url),
    }),
  )
}

function newwh(channel) {
  channel.createWebhook('MameBot-webhook', {
    avatar: client.user.displayAvatarURL(),
  })
}

function chsend(webhook, data) {
  webhook.send({
    content: data.content ?? null,
    username: data.userTag,
    avatarURL: data.userAvatar,
    files: data.attachments,
    embeds: data.embeds,
  })
}
