const rp = require('request-promise');
const $ = require('cheerio');
const puppeteer = require('puppeteer');

const url = 'https://www.reddit.com';

(async () => {
    const browser = await puppeteer.launch()
    const promises = [];

    let worldometerPromise = browser.newPage().then(async page => {
        await page.goto('https://www.worldometers.info/coronavirus/');
        let content = await page.content();
        let worldometerReport = getTaiwanWorldometerReport(content)
        return worldometerReport
    })
    .catch(err => {
        console.log(err);
    });
    
    let cdcPromise = rp("https://covid19dashboard.cdc.gov.tw/dash3")
        .then(getTaiwanCdcReport)
        .catch(function(err){
            console.log(err);
        });

    promises.push(worldometerPromise, cdcPromise);

    let finalReport = await Promise.all(promises).then(aggregateReports);
    console.log(finalReport);

    await browser.close()
})()

function aggregateReports(reports) {
    let finalReport = "Taiwan Covid Statistics\n\n";
    finalReport += reports[0] + "\n";
    finalReport += reports[1];
    return finalReport;
}

function getTaiwanCdcReport(resp) {
    data = JSON.parse(resp)["0"];
    return `
CDC Report

Total Tests:                ${data["送驗"]}
Excluded (Negative tests):  ${data["排除(新)"]}
Confirmed:                  ${data["確診"]}
Deaths:                     ${data["死亡"]}
Recovered:                  ${data["解除隔離"]}
(Since Yesterday) Tested:   ${data["昨日送驗"]}
(Since Yesterday) Excluded: ${data["昨日排除"]}
(Since Yesterday) Deaths:   ${data["昨日確診"]}`
}

function getTaiwanWorldometerReport(content) {
    let table = $('#main_table_countries_today', content).html();
    
    let headers = [];
    $("thead > tr > th", table).each(function(i, elm) {
        headers.push($(elm).text());
    });

    let taiwanRow = $("a", table).filter(function() {
        return $(this).text() === "Taiwan";
    }).closest("tr");

    let taiwanValues = [];
    $("td", taiwanRow).each(function(i, elm) {
        taiwanValues.push($(elm).text());
    });

    if (headers.length !== taiwanValues.length) {
        return "ERROR (Worldometer Report): Number of headers does not match number of values.";
    }

    let report = "Worldometer Values\n\n";
    headers.forEach((e, i) => {
        // Todo: less fragile way to ignore columns we don't care about
        if ([0, 1, 12, 14].includes(i)) {
            return;
        }

        report += e + ":    ";
        report += taiwanValues[i] ? taiwanValues[i] : "N/A";
        report += "\n";
    });
    return report;
}