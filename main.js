'use strict'

const request = require('./request')
const cheerio = require('cheerio')
const moment = require('moment')
const mongoose = require('mongoose')
const fs = require('fs')
const trendingModel = require('./trending-model')

const mongodbURI = 'mongodb://USER:PASS@127.0.0.1:27018,127.0.0.1:27017/DB'

class Main {
    constructor () {
    }

    async handle (area='indonesia', startDate, endDate) {
        let hasNext = true
        startDate.subtract(1, 'h')
        await mongoose.connect(mongodbURI, { useUnifiedTopology: true, useNewUrlParser: true })
        do {
            startDate.add(1, 'h')
            const h = startDate.format('H')
            const date = startDate.format('YYYY-MM-DD')
            hasNext = startDate.diff(endDate) < 0
            const data = await request(`/${area}/${date}/${h}`)
            const jsonData = await this.convertHTMLtoJSON(data, startDate)
            fs.writeFile(`./data/${date}_${startDate.format('HH')}.json`, JSON.stringify(jsonData), {encoding: 'utf-8'}, console.error)
            for (const x of jsonData) {
                await trendingModel.updateOne({
                    service: 'twitter',
                    area,
                    title: x.text,
                    created_at: {
                        $gte: startDate.toDate(),
                        $lte: startDate.clone().add(1, 'h').toDate()
                    }
                }, {
                    $set: {
                        count: x.count,
                        updated_at: new Date()
                    },
                    $setOnInsert: {
                        service: 'twitter',
                        area,
                        title: x.text,
                        url: 'https://twitter.com/search?q=' + encodeURI(x.text),
                        created_at: new Date(x.date)
                    }
                }, {upsert: true})
            }
        } while (hasNext)
    }

    async convertHTMLtoJSON (stringHTML='', currentDate) {
        const date = currentDate.format('YYYY-MM-DD HH:mm')
        const allHtml = cheerio.load(stringHTML)
        const dataText = allHtml('td.main>a').map((i, x) => {
            const text = cheerio.load(x).text()
            return text
        })
        const dataTweetsCount = allHtml('td.main>.desc>.small').map((i, x) => {
            const text = cheerio.load(x).text()?.toLowerCase().replace(/under|tweets| /g, '')
            let n = 0
            if (text.indexOf('k') > -1) {
                n = text.replace('k', '')
                n = parseFloat(n)
                n = n * 1000
            } else if (text.indexOf('m') > -1) {
                n = text.replace('m', '')
                n = parseFloat(n)
                n = n * 1000 * 1000
            }
            return n
        })
        const data = []
        for (const i in dataText) {
            if (typeof dataText[i] === 'string') {
                data.push({
                    text: dataText[i],
                    count: dataTweetsCount[i],
                    date
                })
            } else {
                break
            }
        }
        return data
    }
}

new Main()
    .handle('indonesia', moment('2024-11-03 19:00'), moment('2024-11-03 23:00'))
    .then(function () {
        console.log('---->')
    })
    .catch(err => {
        console.error(err)
        process.exit(1)
    })