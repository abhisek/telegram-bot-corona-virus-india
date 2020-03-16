'use strict'

const express = require('express')
const morgan = require('morgan')
const axios = require('axios')

const app = express()
const bodyParser = require('body-parser')
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
_<%= r.loc -%>_  - Confirmed:<%= r.confirmedCasesIndian + r.confirmedCasesForeign -%> Discharged:<%= r.discharged -%> Deaths:<%= r.deaths -%>
<% }) %>
  `, {})({ data })
}

function buildContactsMessage(data) {
  return EJS.compile(`

  `, {})({ data })
}

async function handleStats(chat_id) {
  return new Promise(function (resolve, reject) {
    axios.get('https://api.rootnet.in/covid19-in/stats/latest')
    .then(function (response) {
      console.log(buildStatsMessage(response.data))
      telegramBot
        .telegram
        .sendMessage(chat_id, buildStatsMessage(response.data), TelegrafExtra.markdown())
      resolve()
    })
    .catch(function (err) {
      reject(err)
    })
  })
}

async function handleContacts(chat_id) {
  return new Promise(function (resolve, reject) {
    axios.get('https://api.rootnet.in/covid19-in/contacts')
    .then(function (response) {
      telegramBot
        .telegram
        .sendMessage(chat_id, buildContactsMessage(response.data), TelegrafExtra.markdown())
      resolve()
    })
    .catch(function (err) {
      reject(err)
    })
  })
}

function handleStart(chat_id) {
  telegramBot
    .telegram
    .sendMessage(chat_id, TELEGRAM_BOT_START_TEXT, TelegrafExtra.markdown())
}

function handleAnythingElse(chat_id) {
  telegramBot
    .telegram
    .sendMessage(chat_id, 'I do not recognize this command')
}

async function botHandler(chat_id, chat_text) {
  return new Promise(function (resolve, reject) {
    if (chat_text === '/start') {
      handleStart(chat_id)
      resolve()
    } else if (chat_text === '/stats') {
      handleStats(chat_id).then(() => resolve()).catch((err) => reject(err))
    } else if (chat_text === '/contacts') {
      handleContacts(chat_id).then(() => resolve()).catch((err) => reject(err))
    } else {
      handleAnythingElse(chat_id)
      resolve()
    }
  })
}

app.use(bodyParser.json())
app.use(morgan('combined'))

app.post('/', async function (req, res) {
  let chat_id = req.body.message.chat.id
  let chat_text = req.body.message.text

  botHandler(chat_id, chat_text)
  .then(function () {
    res.status(200).json({ status: 'OK' })
  })
  .catch(function (err) {
    res.status(500).json({ status: 'ERR', message: err.message })
  })
})

app.get('/', async function (req, res) {
  res.status(200).json({ message: 'Telegram bot for Corona Virus (COVID-19) info in India' })
})

app.listen(port, () => console.log(`API Service listening on port ${port}!`))
