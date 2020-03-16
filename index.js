'use strict'

const express = require('express')
const morgan = require('morgan')

const app = express()
const bodyParser = require('body-parser')
const port = process.env.NODE_PORT || 3000

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_BOT_START_TEXT = `
## Corona Virus (COVID-19) Informational Bot for India

| Command   | Description                       |
|-----------|-----------------------------------|
| /start    | This description                  |
| /stats    | Statistics across states          |
| /contacts | Contact information across states |

Bot source code: \`https://github.com/abhisek/telegram-bot-corona-virus-india\`
`

app.use(bodyParser.json())
app.use(morgan('combined'))

app.get('/', async function (req, res) {
  res.status(200).json({ message: 'Telegram bot for Corona Virus (COVID-19) info in India' })
})

app.listen(port, () => console.log(`API Service listening on port ${port}!`))
