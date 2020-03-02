// https://help.apify.com/en/articles/1640711-how-to-log-in-to-a-website-using-puppeteer

function sleep(ms){
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

module.exports = {
  sleep
}
