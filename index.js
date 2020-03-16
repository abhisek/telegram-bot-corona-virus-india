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
*Corona Virus (COVID-19) Informational Bot for India*

\`\`\`
 Command  | Description
----------|-----------------------------------
/start    | This description
/stats    | Statistics across states
/contacts | Contact information across states
/info     | Get info about COVID-19
/safety   | Get precautions info about COVID-19
\`\`\`

Bot source code: \`https://github.com/abhisek/telegram-bot-corona-virus-india\`
`

const TELEGRAM_BOT_INFO_TEXT = `
*What is the incubation period for COVID-19?*

- The incubation period of COVID-19 is thought to be with 14 days following exposure

- Most cases occurring approximately 5 days after exposure

- In a family cluster of infections, the onset of fever and respiratory syndromes occurred approximately 3-6 days after presumptive exposure

*How much time does the COVID-19 test takes?*

- 1-3 days

*Can people infected but without any symptoms spread the virus?*

- YES

*Who are all at risk?*

All groups are at risk to a varying degree. However the most at risk groups are:

- Socially irresponsible

- Paediatric group

- Pregnancy

- Elderly people

- Old age home at risk

`

const TELEGRAM_BOT_PRECAUTIONS_TEXT = `
*How frequently should we wash hands?*

Wash hands thoroughly with soap or hand sanitizer before touching the face. Avoid touching your eyes, nose, and mouth with unwashed hands.

*If Someone has flu-like symptoms, what should be done?*

Please self-quarantine, and contact 104, your family physician, or call the nearest hospital with the treatment facility. And follow their instructions.

*Are there any sort of self-test kits available?*

No

*Are masks required for healthy individuals?*

No, Only wear a mask if you are ill with COVID-19 symptoms (especially coughing) or looking after someone who may have COVID-19. Disposable face mask can only be used once. If you are not ill or looking after someone who is ill then you are wasting a mask. There is a world-wide shortage of masks, so WHO urges people to use masks wisely.


*Will Alcohol-based hand sanitizer clean hands effectively?*

Yes, it works very well, make sure to wash your hands thoroughly for at least 30sec.
`

const telegramBot = new Telegraf(TELEGRAM_BOT_TOKEN)

function buildStatsMessage(data) {
  return EJS.compile(`
*Corona Virus (COVID-19) Summary in India*

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
*Primary Contacts*

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

function handleInfo(ctx) {
  ctx.reply(TELEGRAM_BOT_INFO_TEXT, TelegrafExtra.markdown())
}

function handleSafety(ctx) {
  ctx.reply(TELEGRAM_BOT_PRECAUTIONS_TEXT, TelegrafExtra.markdown())
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
telegramBot.command('info', (ctx) => handleInfo(ctx))
telegramBot.command('safety', (ctx) => handleSafety(ctx))
telegramBot.hears('hi', (ctx) => ctx.reply('Hey there, I am a bot. Send /start to interact with me'))
telegramBot.on('text', (ctx) => handleAnythingElse(ctx))

// Run as webhook
app.use(morgan('combined'))
app.use(telegramBot.webhookCallback('/'))

app.listen(port, () => console.log(`API Service listening on port ${port}!`))

// Run as client
// telegramBot.launch()