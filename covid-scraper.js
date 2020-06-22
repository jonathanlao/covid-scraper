const rp = require('request-promise');
const $ = require('cheerio');
const puppeteer = require('puppeteer');

const url = 'https://www.reddit.com';

(async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('https://www.worldometers.info/coronavirus/')
    let content = await page.content();

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
        console.log("ERROR: Number of headers does not match number of values.");
        await browser.close()
        return;
    }

    let report = "Taiwan Worldometer Values\n";
    headers.forEach((e, i) => {
        // Todo: less fragile way to ignore columns we don't care about
        if ([0, 1, 12, 14].includes(i)) {
            return;
        }

        report += e + ":    ";
        report += taiwanValues[i] ? taiwanValues[i] : "N/A";
        report += "\n";
    });
    console.log(report);
    
    await browser.close()
})()


  /*
puppeteer
  .launch()
  .then(function(browser) {
    return browser.newPage();
  })
  .then(function(page) {
    return page.goto(url).then(function() {
      return page.content();
    });
  })
  .then(function(html) {
    $('h3', html).each(function() {
      console.log($(this).text());
    });
  })
  .catch(function(err) {
    //handle error
  }); */