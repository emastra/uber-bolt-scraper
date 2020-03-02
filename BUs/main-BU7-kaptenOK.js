const Apify = require('apify');
// const httpRequest = require("@apify/http-request");
const rp = require('request-promise-native');
const { utils: { log } } = Apify;
const tough = require('tough-cookie');

// https://help.apify.com/en/articles/1640711-how-to-log-in-to-a-website-using-puppeteer

const startUrls = [
  { url: 'https://welcome.kapten.com/signin', site: 'kapten' },
  { url: 'https://auth.uber.com/login/', site: 'uber' },
];

const times = ['00:00','01:00','02:00','03:00','08:00','08:30','09:00','09:30','10:00','13:00','15:00', '17:00','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','23:00']

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
    const url = startUrls[i].url;
    const site = startUrls[i].site;
    const info = await requestQueue.addRequest({
      url,
      userData: {
        label: 'LOGIN',
        coords: coordinates,
        site
      }
    });
    // console.log('INFO', info);
  }


  const crawler = new Apify.PuppeteerCrawler({
    requestQueue,
    maxRequestRetries: 2,
    handlePageTimeoutSecs: 720,
    maxConcurrency: 1,

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

    gotoFunction: async ({ request, page }) => {
      // await Apify.utils.puppeteer.blockRequests(page, {
      //   urlPatterns: [ ".jpg", ".jpeg", ".png", ".svg", ".gif", ".woff", "woff2", ".ico", ".pdf", ".zip"],
      // });

      if (request.userData.label === 'SEARCH') {
        console.log('Setting cookie');
        await page.setCookie(...request.userData.cookies);
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
        console.log('INSIDE LOGIN. request.url:', request.url);
        const { site, coords } = request.userData;
        // let isLogged = false;
        console.log('credentials', credentials[site]);

        if (site === 'kapten') {
          console.log('INSIDE SITE KAPTEN');

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
          // console.log('cookies', cookies);

          // let cookie = new tough.Cookie(cookies.filter(c => c.name === 'token')[0]);
          // console.log('cookie', cookie);

          const info = await requestQueue.addRequest({
            url: currentLocation,
            userData: {
              label: 'SEARCH',
              cookies
            }
          }, { forefront: true });
          // console.log('info', info);
        }

        if (site === 'uber') {
          console.log('INSIDE SITE UBER');
        }
      } // fine LOGIN


      if (label === 'SEARCH') {
        console.log('INSIDE SEARCH');
        const cookies = request.userData.cookies;

        let cookie = new tough.Cookie(cookies.filter(c => c.name === 'token')[0]);
        let cookiejar = rp.jar();
        cookiejar.setCookie(cookie, 'https://app.kapten.com');

        // const items = [];

        for (let i = 0; i < coordinates.length; i++) {
          // console.log('current coordinates', coordinates[i]);
          const coords = coordinates[i];
          const fromCoords = coords[0].split(',');
          const toCoords = coords[1].split(',');
          const fromLat = fromCoords[0];
          const fromLng = fromCoords[1];
          const toLat = toCoords[0];
          const toLng = toCoords[1];

          const today = new Date();
          const date = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;

          for (let i = 0; i < times.length; i++) {
            const time = times[i];
            const dateTime = `${date}T${time}:00`
            console.log(dateTime);

            const res = await rp({
              method: 'POST',
              url: 'https://app.kapten.com/api/proxy',
              proxyUrl: `http://auto:${process.env.APIFY_PROXY_PASSWORD}@proxy.apify.com:8000`,
              jar: cookiejar,
              form: {
                'routine_name': 'ride_price',
                'from[position][latitude]': fromLat,
                'from[position][longitude]': fromLng,
                // 'from[url]': '/api/geo/places/geofixes/593954161580721000fed8ca',
                'appPlatform': 'web',
                'car_type': 'standard',
                'appVersion': 'Mozilla/5.0+(X11;+Ubuntu;+Linux+x86_64;+rv:69.0)+Gecko/20100101+Firefox/69.0',
                'payment[type]': 'cb',
                'payment[_type]': 'cb',
                'payment[ccId]': ''	,
                'payment[clientCode]': '',
                'to[position][latitude]': toLat,
                'to[position][longitude]': toLng,
                // 'to[url]': '/api/geo/places/geofixes/578f92a9ae1aec10009edb7d',
                'date': new Date(dateTime).getTime(),
                'token': cookie.value
              },
              json: true
            });

            await Apify.pushData({
              source: 'kapten',
              date: date,
              time: time,
              route: coords,
              price: res.res.price,
              arrival: null,
              surge: res.res.booking_fee
            });
          }

          // console.log('Done item', i);
        }

        // await Apify.pushData(items);
      } // fine SEARCH

    } // fine HANDLEFUNC
  });

  log.info('Starting crawler.');
  await crawler.run();

  log.info('Crawler Finished.');
});
