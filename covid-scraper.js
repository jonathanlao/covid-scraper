const rp = require('request-promise');
const puppeteer = require('puppeteer');
const reports = require('./reports.js');

(async () => {
    const browser = await puppeteer.launch()
    const promises = [];

    let worldometerPromise = browser.newPage()
        .then(async page => {
            await page.goto('https://www.worldometers.info/coronavirus/');
            let content = await page.content();
            let worldometerReport = reports.getTaiwanWorldometerReport(content)
            return worldometerReport
        })
        .catch(err => {
            console.log(err);
        });
    
    let cdcPromise = rp("https://covid19dashboard.cdc.gov.tw/dash3")
        .then(reports.getTaiwanCdcReport)
        .catch(err => {
            console.log(err);
        });

    promises.push(worldometerPromise, cdcPromise);
    let finalReport = await Promise.all(promises).then(reports.aggregateReports);

    console.log(finalReport);

    await browser.close()
})()