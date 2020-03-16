'use strict'

const express = require('express')
const morgan = require('morgan')
const axios = require('axios')

const app = express()
const port = process.env.NODE_PORT || 3000

const EJS = require('ejs')

const Telegraf = require('telegraf')
const TelegrafExtra = require('telegraf/extra')

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_BOT_START_TEXT = `
**Corona Virus (COVID-19) Informational Bot for India**

\`\`\`
 Command  | Description
----------|-----------------------------------
/start    | This description
/stats    | Statistics across states
/contacts | Contact information across states
\`\`\`

Bot source code: \`https://github.com/abhisek/telegram-bot-corona-virus-india\`
`

const telegramBot = new Telegraf(TELEGRAM_BOT_TOKEN)

function buildStatsMessage(data) {
  return EJS.compile(`
**Corona Virus (COVID-19) Summary in India**

Total: <%= data.data.summary.total %>
Confirmed (Indian): <%= data.data.summary.confirmedCasesIndian %>
Confirmed (Foreigner): <%= data.data.summary.confirmedCasesForeign %>
Discharged: <%= data.data.summary.discharged %>
Death(s): <%= data.data.summary.deaths %>

<% data.data.regional.forEach(function (r) { %>
<%= r.loc %>
Confirmed:<%= r.confirmedCasesIndian + r.confirmedCasesForeign -%> Discharged:<%= r.discharged -%> Deaths:<%= r.deaths -%>

<% }) %>
  `, {})({ data })
}

function buildContactsMessage(data) {
  return EJS.compile(`
**Primary Contact**

Phone: <%= data.data.contacts.primary.number %>
Email: <%= data.data.contacts.primary.email %>
Twitter: <%= data.data.contacts.primary.twitter %>
Facebook: <%= data.data.contacts.primary.facebook %>
Media: <%= data.data.contacts.primary.media %>

<% data.data.contacts.regional.forEach(function (r) { %>
<%= r.loc -%>: <%= r.number -%>
<% }) %>
  `, {})({ data })
}

async function handleStats(ctx) {
  return new Promise(function (resolve, reject) {
    axios.get('https://api.rootnet.in/covid19-in/stats/latest')
    .then(function (response) {
      try {
        ctx.reply(buildStatsMessage(response.data))
        resolve()
      }
      catch(ex) {
        reject(ex)
      }
    })
    .catch(function (err) {
      reject(err)
    })
  })
}

async function handleContacts(ctx) {
  return new Promise(function (resolve, reject) {
    axios.get('https://api.rootnet.in/covid19-in/contacts')
    .then(function (response) {
      try {
        ctx.reply(buildContactsMessage(response.data))
        resolve()
      }
      catch(ex) {
        reject(ex)
      }
    })
    .catch(function (err) {
      reject(err)
    })
  })
}

function handleStart(ctx) {
  ctx.reply(TELEGRAM_BOT_START_TEXT, TelegrafExtra.markdown())
}

function handleAnythingElse(ctx) {
  ctx.reply(`I don't recognize the command. Send /start to interact with me`, TelegrafExtra.markdown())
}

telegramBot.start((ctx) => handleStart(ctx))
telegramBot.help((ctx) => handleStart(ctx))
telegramBot.command('stats', async (ctx) => await handleStats(ctx))
telegramBot.command('contacts', async (ctx) => await handleContacts(ctx))
telegramBot.hears('hi', (ctx) => ctx.reply('Hey there, I am a bot. Send /start to interact with me'))
telegramBot.on('text', (ctx) => handleAnythingElse(ctx))

// Run as webhook
app.use(morgan('combined'))
app.use(telegramBot.webhookCallback('/'))

app.listen(port, () => console.log(`API Service listening on port ${port}!`))

// Run as client
// telegramBot.launch()