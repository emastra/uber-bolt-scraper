const Apify = require('apify');
const rp = require('request-promise-native');
const { utils: { log } } = Apify;

const startUrls = [
  'https://welcome.kapten.com/signin',
  // 'm.uber.com',
  // 'm.bolt.eu'
];

// utils
function sleep(ms){
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}


Apify.main(async () => {
  // get input
  const input = await Apify.getValue('INPUT');
  const { coordinates, credentials } = input; // array di array

  // if (!input.query || !input.location) throw new Error('INPUT must have "query" and "location" properties.');
  // if (!input.count) input.count = 5;
  // if (!input.useApifyProxy) input.useApifyProxy = false;

  const requestQueue = await Apify.openRequestQueue();
  for (let i = 0; i < startUrls.length; i++) {
    const info = await requestQueue.addRequest({
      url: startUrls[i],
      userData: {
        label: 'LOGIN',
        site: 'kapten',
        coords: coordinates
      }
    });
    console.log('INFO', info);
  }

  const crawler = new Apify.PuppeteerCrawler({
    requestQueue,
    maxRequestRetries: 2,
    handlePageTimeoutSecs: 720,
    minConcurrency: 2,

    launchPuppeteerFunction: async () => Apify.launchPuppeteer({
      proxyUrl: `http://country-US:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
      userAgent: Apify.utils.getRandomUserAgent(),
      headless: true,
      // devtools: true,
      // slowMo: 1000
    }),

    // gotoFunction: async ({ request, page }) => {
    //   await Apify.utils.puppeteer.blockRequests(page, {
    //     urlPatterns: [ ".jpg", ".jpeg", ".png", ".svg", ".gif", ".woff", ".ico", ".pdf", ".zip"],
    //   });
    //
    //   return page.goto(request.url, {
    //     timeout: 121 * 1000,
    //     waitUntil: 'domcontentloaded'
    //   });
    // },

    handlePageFunction: async ({ page, request, response }) => {
      console.log('Processing:', request.url);
      const { label } = request.userData;
      const status = response.status();
      console.log('Status:', status);

      if (status === 404 || status === 410) return;


      if (label === 'LOGIN') {
        console.log('INSIDE LOGIN. request.url:', request.url);
        const { site, coords } = request.userData;

        await page.waitForSelector('#password-2');
        await page.evaluate((credentials) => {
          const emailInput = document.getElementById('email-1');
          const passwordInput = document.getElementById('password-2');

          emailInput.value = credentials.username;
          passwordInput.focus();
          passwordInput.value = credentials.password;
        }, {
          username: credentials[site].username,
          password: credentials[site].password
        });

        const [response] = await Promise.all([
          page.waitForNavigation({ timeout: 60*1000, waitUntil: 'domcontentloaded' }),
          page.click('button[type=submit]')
        ]);

        console.log('PROMISE RESPONSE', response);
        console.log('Status:', response.request._status);
        console.log('Headers', response.request._headers);

        currentLocation = await page.evaluate(() => window.location.href);
        console.log('CURRENT PAGE', currentLocation);


      } // fine LOGIN


      if (label === 'CATEGORY') {

      } // fine CATTTTT


    } // fine HANDLEFUNC
  });

  log.info('Starting crawler.');
  await crawler.run();

  log.info('Crawler Finished.');
});
