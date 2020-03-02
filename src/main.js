/*
Kapten:
If I log in with headful puppeteer, grab cookies and fire http requests, it works.
But it does not in headless mode (there is an error during login as per screenshot I sent you previously).
If I try to access directly the website with stored cookies, it does not work (I'm redirected to login page and http requests receive a 401).
ONLY MOBILE NOW

Uber:
In headful mode, I can access directly with stored cookies and fire requests. It works.
But it does not in headless mode (I receive a 500 http code).

Bolt:
It works. In headless mode and accessing the website directly with stored cookies.

*/


const Apify = require('apify');
const { log, sleep } = Apify.utils;

const { kaptenLogin, extractKapten } = require('./kapten');
const { uberLogin, extractUber } = require('./uber');
const { boltLogin, extractBolt } = require('./bolt');

const startUrls = [
  // { url: 'https://welcome.kapten.com/signin', site: 'kapten' },
  { url: 'https://auth.uber.com/login/', site: 'uber' },
  // { url: 'https://m.bolt.eu/', site: 'bolt' }
];

Apify.main(async () => {
  // get and check input
  const { coordinates, credentials } = await Apify.getValue('INPUT');
  if (!coordinates) throw new Error('INPUT must have "coordinates" property.');
  if (!credentials) throw new Error('INPUT must have "credentials" property.');

  // For testing...
  coordinates.splice(4);

  const session = Date.now().toString();
  const username = `session-${session},country-FR`;
  const password = process.env.APIFY_PROXY_PASSWORD;
  const proxyUrl = `http://${username}:${password}@proxy.apify.com:8000`;
  const userAgent = Apify.utils.getRandomUserAgent();
  const proxyOptions = { proxyUrl, userAgent };

  const requestQueue = await Apify.openRequestQueue();

  for (let i = 0; i < startUrls.length; i++) {
    const url = startUrls[i].url;
    const site = startUrls[i].site;

    await requestQueue.addRequest({
      url,
      userData: {
        label: 'LOGIN',
        coords: coordinates,
        site
      }
    });
  }


  const crawler = new Apify.PuppeteerCrawler({
    requestQueue,
    maxRequestRetries: 3,
    handlePageTimeoutSecs: 720,
    maxConcurrency: 1,
    useSessionPool: true,

    launchPuppeteerOptions: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL'],
        timeout: 120 * 1000,
        useChrome: true,
        stealth: true,
        headless: false,
        // devtools: true
    },
    useSessionPool: true,

    gotoFunction: async ({ request, page }) => {
      if (request.userData.label.includes('EXTRACT')) {
        const { cookies } = request.userData;

        console.log('Setting cookie');
        await page.setCookie(...cookies);
      }

      return page.goto(request.url, {
        timeout: 121 * 1000,
        waitUntil: 'domcontentloaded'
      });
    },

    handlePageFunction: async ({ page, request, response }) => {
      console.log('Processing:', request.url);

      const { label } = request.userData;
      const status = response.status();
      console.log('Status:', status);

      if (status === 404 || status === 410) return;


      //////////////////////////////////////////////// LOGIN

      if (label === 'LOGIN') {
        const { site } = request.userData;

        // KAPTEN
        if (site === 'kapten') {
          console.log('Logging into kapten...');

          const info = await kaptenLogin(requestQueue, page, credentials[site]);
          if (info) console.log('Kapten login done:', info);
        }

        // UBER
        if (site === 'uber') {
          console.log('Logging into uber...');

          const info = await uberLogin(requestQueue, page, credentials[site], coordinates);
          console.log('uberLogin done:', info);
        }

        // BOLT
        if (site === 'bolt') {
          console.log('Logging into bolt...');

          const info = await boltLogin(requestQueue, credentials[site]);
          console.log('boltLogin done.');
        }
      }


      //////////////////////////////////////////////////// EXTRACT

      // KAPTEN
      if (label === 'EXTRACT-KAPTEN') {
        console.log('Starting querying kapten...');
        const { cookies } = request.userData;

        await extractKapten(cookies, coordinates, proxyOptions);
        console.log('Kapten done!');
      }

      // UBER
      if (label === 'EXTRACT-UBER') {
        console.log('Extracting uber data...');
        const { coords } = request.userData;

        await extractUber(page, coords);
      }

      // BOLT
      if (label === 'EXTRACT-BOLT') {
        console.log('INSIDE EXTRACT-BOLT');
        const { cred } = request.userData;

        await extractBolt(coordinates, cred);
        console.log('Bolt done!');
      }
    } // fine HANDLEFUNC
  });

  log.info('Starting crawler.');
  await crawler.run();

  log.info('Crawler Finished.');
});
