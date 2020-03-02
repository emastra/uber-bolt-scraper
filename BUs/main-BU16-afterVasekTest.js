const Apify = require('apify');
const { utils: { log } } = Apify;

const { kaptenLogin, extractKapten } = require('./kapten');
const { uberLogin, extractUber } = require('./uber');
const { boltLogin, extractBolt } = require('./bolt');

const { sleep } = require('./utils');
const fs = require('fs');

const startUrls = [
  // { url: 'https://welcome.kapten.com/signin', site: 'kapten' },
  // { url: 'https://app.kapten.com/commander', site: 'kapten' },
  { url: 'https://auth.uber.com/login/', site: 'uber', uniqueKey: '12345' },
  // { url: 'https://m.bolt.eu/', site: 'bolt' }
];

// const times = ['00:00','01:00','02:00','03:00','08:00','08:30','09:00','09:30','10:00','13:00','15:00', '17:00','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','23:00']
// const times = ['00:00','15:00']



Apify.main(async () => {
  // get and check input
  const { coordinates, credentials } = await Apify.getValue('INPUT');
  if (!coordinates) throw new Error('INPUT must have "coordinates" property.');
  if (!credentials) throw new Error('INPUT must have "credentials" property.');

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
      uniqueKey: '12345',
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

    launchPuppeteerFunction: async () => Apify.launchPuppeteer({
      // useApifyProxy: true,
      proxyUrl: proxyUrl,
      userAgent: userAgent,
      // apifyProxySession: Math.random(),
      useChrome: true,
      stealth: true,
      // stealthOptions: {
      //   addPlugins: false,
      //   emulateWindowFrame: false,
      //   emulateWebGL: false,
      //   emulateConsoleDebug: false,
      //   addLanguage: false,
      //   hideWebDriver: true,
      //   hackPermissions: false,
      //   mockChrome: false,
      //   mockChromeInIframe: false,
      //   mockDeviceMemory: false,
      // },
      headless: false,
      devtools: true,
      // slowMo: 1000
    }),

    gotoFunction: async ({ request, page }) => {
      // const uberCookies = require('./uberCookies.js');
      // console.log('uberCookies', typeof uberCookies, uberCookies);
      // await page.setCookie(...uberCookies);

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
          if (info) console.log('Kapten: logged in successfully and added EXTRACT-KAPTEN');
        }

        // UBER
        if (site === 'uber') {
          console.log('Logging into uber...');

          const info = await uberLogin(requestQueue, page, credentials[site]);
          console.log('uberLogin done:', info);
        }

        // BOLT
        if (site === 'bolt') {
          console.log('Logging into bolt...');

          const info = await boltLogin(requestQueue, credentials[site]);
        }
      } // fine LOGIN


      //////////////////////////////////////////////////// EXTRACT

      // KAPTEN
      if (label === 'EXTRACT-KAPTEN') {
        console.log('Starting querying kapten...');
        const { cookies } = request.userData;

        await extractKapten(cookies, coordinates, proxyOptions);
        console.log('Kapten done!');
      } // fine EXTRACT-KAPTEN

      // UBER
      if (label === 'EXTRACT-UBER') {
        console.log('INSIDE EXTRACT-UBER');

        await sleep(2000);
        console.log('Ciaooooo');

        // const responsePromise = page.waitForResponse((res) => {
        //   return res.url() === 'https://m.uber.com/api/getFareEstimates'
        //   && res.status() === 200;
        //   // return res.status() === 200;
        // });
        // console.log('INSIDE SEARCH-UBER - promise set!');
        // console.log('we are at', request.url);
        //
        // // const responsePromise = request.userData.promise;
        //
        // const response = await responsePromise;
        //
        // console.log(response);
      }

      // BOLT
      if (label === 'EXTRACT-BOLT') {
        console.log('INSIDE EXTRACT-BOLT');
        const { cred } = request.userData;

        await extractBolt(coordinates, cred);
        console.log('Bolt done!');
      } // EXTRACT-BOLT


    } // fine HANDLEFUNC
  });

  log.info('Starting crawler.');
  await crawler.run();

  log.info('Crawler Finished.');
});
