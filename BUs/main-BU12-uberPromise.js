const Apify = require('apify');
const { utils: { log } } = Apify;

const { kaptenLogin, extractKapten } = require('./kapten');
const { uberLogin, extractUber } = require('./uber');
const { boltLogin, extractBolt } = require('./bolt');

const startUrls = [
  // { url: 'https://welcome.kapten.com/signin', site: 'kapten' },
  { url: 'https://auth.uber.com/login/', site: 'uber' },
  // { url: 'https://m.bolt.eu/', site: 'bolt' },
  // { url: '', site: 'bolt' },
];

// const times = ['00:00','01:00','02:00','03:00','08:00','08:30','09:00','09:30','10:00','13:00','15:00', '17:00','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','23:00']
const times = ['00:00','15:00']



Apify.main(async () => {
  // get and check input
  const { coordinates, credentials } = await Apify.getValue('INPUT');
  if (!coordinates) throw new Error('INPUT must have "coordinates" property.');
  if (!credentials) throw new Error('INPUT must have "credentials" property.');

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

    launchPuppeteerFunction: async () => Apify.launchPuppeteer({
      // useApifyProxy: true,
      proxyUrl: `http://country-FR:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
      userAgent: Apify.utils.getRandomUserAgent(),
      useChrome: true,
      stealth: true,
      headless: false,
      // devtools: true,
      // slowMo: 1000
    }),

    gotoFunction: async ({ request, page }) => {
      // await Apify.utils.puppeteer.blockRequests(page, {
      //   urlPatterns: [ ".jpg", ".jpeg", ".png", ".svg", ".gif", ".woff", "woff2", ".ico", ".pdf", ".zip"],
      // });

      if (request.userData.label.includes('SEARCH')) {
        if (!request.url.includes('uber')) {
          console.log('Setting cookie');
          await page.setCookie(...request.userData.cookies);
        }
        // if (request.url.includes('uber')) {
        //   const responsePromise = page.waitForResponse((res) => {
        //     return res.url() === 'https://m.uber.com/api/getFareEstimates'
        //     && res.status() === 200
        //   });
        //
        //   request.userData.promise = responsePromise;
        //   console.log('set userData.promise');
        // }
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

      if (label === 'LOGIN') {
        const { site, coords } = request.userData;

        // KAPTEN
        if (site === 'kapten') {
          console.log('Logging into kapten...');

          const info = await kaptenLogin(requestQueue, page, credentials[site]);
          if (info) console.log('Kapten: logged in successfully and added SEARCH-KAPTEN');
        }

        // UBER
        if (site === 'uber') {
          console.log('Logging into uber...');

          const info = await uberLogin(requestQueue, credentials[site], request.userData.coords);
          console.log('uberLogin done:', info);
        }

        // BOLT
        if (site === 'bolt') {
          console.log('Logging into bolt...');

          const info = await boltLogin(requestQueue, credentials[site]);
        }
      } // fine LOGIN


      if (label === 'SEARCH-KAPTEN') {
        console.log('Starting querying kapten...');

        await extractKapten(request, coordinates, times);
        console.log('Kapten done!');
      } // fine SEARCH-KAPTEN

      if (label === 'SEARCH-UBER') {
        const responsePromise = page.waitForResponse((res) => {
          return res.url().includes('getFareEstimates')
          && res.status() === 200
        });
        console.log('INSIDE SEARCH-UBER - promise set!');
        console.log('we are at', request.url);

        // const responsePromise = request.userData.promise;

        const response = await responsePromise;

        console.log(response);
      }

      if (label === 'SEARCH-BOLT') {
        console.log('INSIDE SEARCH-BOLT');
        const { cred } = request.userData;

        await extractBolt(coordinates, cred);
      }

    } // fine HANDLEFUNC
  });

  log.info('Starting crawler.');
  await crawler.run();

  log.info('Crawler Finished.');
});
