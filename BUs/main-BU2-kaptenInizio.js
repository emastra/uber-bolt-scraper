const Apify = require('apify');
const httpRequest = require("@apify/http-request");
const { utils: { log } } = Apify;
const { CookieJar } = require('tough-cookie');

// https://help.apify.com/en/articles/1640711-how-to-log-in-to-a-website-using-puppeteer

const startUrls = [
  // 'https://welcome.kapten.com/signin',
  'https://auth.uber.com/login/',
  // 'm.bolt.eu'
];

// utils
function sleep(ms){
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

const loggedCheck = async (page) => {
  try {
    await page.waitForSelector('a.disconnect', { timeout: 10*1000 });
    return true;
  } catch(err) {
    return false;
  }
};

async function doLogin(options) {
  const { emailSelector, pwSelector, email, pw, submitBtnSelector } = options;

  await page.waitForSelector(pwSelector, { timeout: 61*1000 });
  await page.type(emailSelector, email);
  await page.type(pwSelector, pw);

  const [response] = await Promise.all([
    page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' }),
    page.click(submitBtnSelector)
  ]);

  console.log('PROMISE RESPONSE', response);
  // console.log('Status:', response._request._status);
  // console.log('Headers', response._request._headers);

  currentLocation = await page.evaluate(() => window.location.href);
  console.log('CURRENT PAGE', currentLocation);

  return true;
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
        site: 'uber',
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
      // userAgent: Apify.utils.getRandomUserAgent(),
      headless: false,
      // devtools: true,
      // slowMo: 1000
    }),

    gotoFunction: async ({ request, page }) => {
      await Apify.utils.puppeteer.blockRequests(page, {
        urlPatterns: [ ".jpg", ".jpeg", ".png", ".svg", ".gif", ".woff", "woff2", ".ico", ".pdf", ".zip"],
      });

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
        let isLogged = false;

        // if (site === 'kapten') {
        // await page.waitForSelector('#password-2', { timeout: 61*1000 });
        // await page.type('#email-1', credentials[site].username);
        // await page.type('#password-2', credentials[site].password);
        //
        // const [response] = await Promise.all([
        //   page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' }),
        //   page.click('button[type=submit]')
        // ]);
        //
        // console.log('PROMISE RESPONSE', response);
        // console.log('Status:', response._request._status);
        // console.log('Headers', response._request._headers);
        //
        // currentLocation = await page.evaluate(() => window.location.href);
        // console.log('CURRENT PAGE', currentLocation);
        //
        //   const cookies = await page.cookies();
        //   console.log('cookies', cookies);
        //
        //   const cookieJar = new CookieJar();
        //   cookies.forEach(cookie => {
        //     cookieJar.setCookie(cookie, 'app.kapten.com');
        //   });
        //
        //
        //   const { headers, body, statusCode } = await httpRequest({
        //     method: 'POST',
        //     url: '',
        //     form: {
        //       routine_name:	'ride_price',
        //       from: {
        //         street: "Musée+de+l'orangerie,+Tuileries",
        //         city: 'Paris',
        //         postcode: '75001',
        //         position: {
        //           latitude: '48.864085',
        //           longitude: '2.321538',
        //           url: '/api/geo/places/geofixes/593954161580721000fed8ca'
        //         }
        //       },
        //       to: {
        //         street: 'Parc+astérix',
        //         city: 'PLAILLY',
        //         postcode: '60128',
        //         position: {
        //           latitude: '49.1297762',
        //           longitude: '2.5714552',
        //           url: '/api/geo/places/geofixes/578f92a9ae1aec10009edb7d'
        //         }
        //       }
        //     },
        //     token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1c2VyX2lkIjoiNWRhNDI0NTBhMzI5MmIxNjAwZTYyOGQ2Iiwic3ViIjoiNWRhNDI0NTBhMzI5MmIxNjAwZTYyOGQ2Iiwicm9sZXMiOlt7Im5hbWUiOiJjcDpjbGllbnQ6cmlkZXI6In1dLCJpc3MiOiI1ZGE0MjQ1MGEzMjkyYjE2MDBlNjI4ZDYiLCJkaXNwbGF5X25hbWUiOiJFbGxvIE1hc3RvIiwiaWF0IjoxNTcxMjM1MzgxLCJleHAiOjE1NzEyMzU2ODF9.HYwwhS4lNL6eDK6Aq3thYdDVlEA3pap0zbxqSetu9UhzRCSg6yr9PBQgi58gFBxFAQgIXgkMM0rT0nLrRiYvFpCM7ij01L41AEAxE21p4Lmo-mQkdexFCKSEJcwvrCOJocKngzXPuqxulKIKVEJkjQXskOp9Ffp98bjfLTWSiRSqrt80cR3RwZmnWqNjGKxtA1BAw-9pZOpWmFX3_ngFq0CrnDdsakCylfOejfn15h6m9qYUeUT88dNVVgN5qpjBKhbn_5AhG9P2VUZMA_VdbOaQr6I2mi6Ki0AjlFDXpKJHRMVdh_hTmfyZsxjzycwrv1qlrROcjR6g1xjjjmn_cryralf-Y7VLH_Kn-lVebxtoI8mKRKEl6xqbKZGxHt0aQpbB40t1rNr8qBmrIMxrL-Ccpxwd0Lxk_qKJm0mYiNbiWJ8SCMFDNnVD2E2xYWnsrJSN2lRE1HbF_4OU-nNmjP1KJwQWQsQxIlAdDNYmijl2h-1CZkBQH6k169mgI45CJO85bfM1P72dsX1jgJWO0RnCRrxfRn_DzPcLZbTRNIHVoutS7BPxQWMOntZt3ywsdH_gzfclrB3-rNQhdiMuVg8ivhqvqkrmlb8FSht8fbS4u8m4VDzS9SfeerO5bbvvLDH6Xr4hK-XdabVARljt9XcwysI6xwM8FjMpTQFKSgg',
        //     headers: {
        //       'Host': 'app.kapten.com',
        //       'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:69.0) Gecko/20100101 Firefox/69.0',
        //       'Accept': 'application/json, text/javascript, */*; q=0.01',
        //       'Accept-Language': 'en-US,en;q=0.5',
        //       'Accept-Encoding': 'gzip, deflate, br',
        //       'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        //       'X-Requested-With': 'XMLHttpRequest',
        //       'Content-Length': '1741',
        //       'Connection': 'keep-alive',
        //       'Referer': 'https://app.kapten.com/commander',
        //       'TE': 'Trailers'
        //     },
        //     cookieJar
        //   });
        //
        //   console.log(headers, body, statusCode);
        // }

        if (site === 'uber') {
          console.log('INSIDE LOGIN UBER');

          const loginDone = await doLogin({
            emailSelector,
            pwSelector,
            credentials[site].username,
            credentials[site].password,
            submitBtnSelector
          });

          console.log('loginDone', loginDone);
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
