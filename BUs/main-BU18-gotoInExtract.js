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
  { url: 'https://auth.uber.com/login/', site: 'uber' },
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
        console.log('INSIDE EXTRACT');
        let currentLocation = await page.evaluate(() => window.location.href);
        console.log('currentLocation', currentLocation);

        if (currentLocation !== 'https://m.uber.com/looking') console.log('NOT IN /LOOKING');

        for (let i = 0; i < coordinates.length; i++) {
          const coords = coordinates[i];

          const drop = coords[0];
          const pick = coords[1];
          const dropLat = drop.split(',')[0];
          const dropLng = drop.split(',')[1];
          const pickLat = pick.split(',')[0];
          const pickLng = pick.split(',')[1];

          const responsePromise = page.waitForResponse((res) => {
            return res.url() === 'https://m.uber.com/api/getFareEstimates'
            && res.status() === 200;
          });
          console.log('promise set!');

          await page.goto(`https://m.uber.com/looking
            ?drop={"latitude":${dropLat},"longitude":${dropLng}}
            &pickup={"latitude":${pickLat},"longitude":${pickLng}}`,
            { timeout: 120*1000, waitUntil: 'load' }
          );

          console.log('Waiting promise...');
          const res = await responsePromise;

          console.log('Promise response', res);
          console.log('Promise res status', res.status);

          const data = res.data;
          const defaultVehicle = data.status.defaultVehicleViewId;
          const estimates = data.estimates[defaultVehicle];

          const now = new Date();
          const date = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
          const time = `${now.getHours()}:${now.getMinutes()}`;

          const item = {
            source: 'uber',
            date: date,
            time: time,
            route: coords, //
            price: estimates.formattedFare,
            arrival: estimates.etd.estimatedTripTime,
            surge: estimates.surcharge
          }

          await Apify.pushData(item);
          console.log('Pushed uber', time, coords);
        } // fine for loop

      } // fine EXTRACT-UBER

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
