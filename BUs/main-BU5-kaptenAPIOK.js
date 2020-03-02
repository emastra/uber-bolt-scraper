const Apify = require('apify');
// const httpRequest = require("@apify/http-request");
const rp = require('request-promise-native');
const { utils: { log } } = Apify;
const tough = require('tough-cookie');

const fs = require('fs');

// https://help.apify.com/en/articles/1640711-how-to-log-in-to-a-website-using-puppeteer

const startUrls = [
  'https://welcome.kapten.com/signin',
  // 'https://auth.uber.com/login/',
  // 'm.bolt.eu'
];

// utils
async function doLogin(options) {
  const { page, emailSelector, pwSelector, submitBtnSelector, email, pw } = options;

  await page.waitForSelector(pwSelector, { timeout: 123*1000 });
  await page.type(emailSelector, email);
  await page.type(pwSelector, pw);

  [response] = await Promise.all([
    page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' }),
    page.click(submitBtnSelector)
  ]);

  // console.log('PROMISE RESPONSE of login', response);

  // console.log('Status:', response._request._status);
  // console.log('Headers', response._request._headers);

  return response;
}

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
    // console.log('INFO', info);
  }


  const crawler = new Apify.PuppeteerCrawler({
    requestQueue,
    maxRequestRetries: 2,
    handlePageTimeoutSecs: 720,
    minConcurrency: 2,

    launchPuppeteerFunction: async () => Apify.launchPuppeteer({
      // proxyUrl: `http://country-US:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
      useApifyProxy: true,
      userAgent: Apify.utils.getRandomUserAgent(),
      useChrome: true,
      stealth: true,
      headless: false,
      // devtools: true,
      // slowMo: 1000
    }),

    // gotoFunction: async ({ request, page }) => {
    //   await Apify.utils.puppeteer.blockRequests(page, {
    //     urlPatterns: [ ".jpg", ".jpeg", ".png", ".svg", ".gif", ".woff", "woff2", ".ico", ".pdf", ".zip"],
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
        let isLogged = false;
        console.log('credentials', credentials[site]);

        if (site === 'kapten') {
          console.log('INSIDE SIET KAPTEN');

          const loginRes = await doLogin({
            page,
            emailSelector: '#email-1',
            pwSelector: '#password-2',
            submitBtnSelector: 'button[type=submit]',
            email: credentials[site].username,
            pw: credentials[site].password,
          });

          currentLocation = await page.evaluate(() => window.location.href);
          console.log('VERIFICATION CURRENT PAGE:', currentLocation);

          // Get cookies
          const cookies = await page.cookies();
          console.log('cookies', cookies);

          let cookie = new tough.Cookie(cookies.filter(c => c.name === 'token')[0]);
          let cookiejar = rp.jar();
          cookiejar.setCookie(cookie, 'https://app.kapten.com');

          const res = await rp({
            method: 'POST',
            url: 'https://app.kapten.com/api/proxy',
            jar: cookiejar,
            form: {
              'routine_name': 'ride_price',
              'from[street]': "Musée+de+l'orangerie,+Tuileries",
              'from[city]': 'Paris',
              'from[postcode]': 75001,
              'from[position][latitude]': 48.864085,
              'from[position][longitude]': 2.321538,
              'from[url]': '/api/geo/places/geofixes/593954161580721000fed8ca',
              'appPlatform': 'web',
              'car_type': 'standard',
              'appVersion': 'Mozilla/5.0+(X11;+Ubuntu;+Linux+x86_64;+rv:69.0)+Gecko/20100101+Firefox/69.0',
              'payment[type]': 'cb',
              'payment[_type]': 'cb',
              'payment[ccId]': ''	,
              'payment[clientCode]': '',
              'to[street]': 'Parc+astérix',
              'to[city]': 'PLAILLY',
              'to[postcode]': 60128,
              'to[position][latitude]': 49.1297762,
              'to[position][longitude]': 2.5714552,
              'to[url]': '/api/geo/places/geofixes/578f92a9ae1aec10009edb7d',
              'token': cookie.value
            }
          });

          console.log('REEEEEEESSSSSSSSS:', res);

        }
      } // fine LOGIN





      if (label === 'CATEGORY') {
        const rideCacheStore = await Apify.openKeyValueStore('fcb-cache');
        const cookiesStoreKey = credentials[site].username.replace('@', '(at)');

        let userCookies = await rideCacheStore.getValue(cookiesStoreKey);
        if (userCookies) {
          console.log('Try to use cookies from cache..')
          await page.setCookie(...userCookies);
          await page.goto('https://app.kapten.com/commander');

          isLogged = await loggedCheck(page);
        }

        if (!isLogged) {
          console.log(`Cookies from cache didn't work, try to login..`);
          await page.goto('https://app.kapten.com/commander');
          await page.type('#email-1', credentials[site].username);
          await page.type('#password-2', credentials[site].password);
          const [response] = await Promise.all([
            page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' }),
            page.click('button[type=submit]')
          ]);

          isLogged = await loggedCheck(page);
        }

        if (!isLogged) {
          throw new Error('Incorrect username or password!')
        }

        // Get cookies and refresh them in store cache
        console.log(`Saving new cookies to cache..`);
        const cookies = await page.cookies();
        await rideCacheStore.setValue(cookiesStoreKey, cookies);

        // Use cookies in other tab or browser
        const page2 = await browser.newPage();
        await page2.setCookie(...cookies);
        await page2.goto(''); // Opens page as logged user

        await browser.close();

        console.log('Done.');

      } // fine CATTTTT


    } // fine HANDLEFUNC
  });

  log.info('Starting crawler.');
  await crawler.run();

  log.info('Crawler Finished.');
});
