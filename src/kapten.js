const Apify = require('apify');
const rp = require('request-promise-native');
const tough = require('tough-cookie');
const { sleep } = Apify.utils;
const fs = require('fs');

async function getIP(proxyUrl) {
  const ipaddr = await rp({
    url: 'http://api.ipify.org/',
    proxy: proxyUrl
  });

  return ipaddr;
}

async function saveScreen(page, key = 'debug-screen') {
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    await Apify.setValue(key, screenshotBuffer, { contentType: 'image/png' });
};


//

async function kaptenLogin(requestQueue, page, cred) {
  await page.waitForSelector('#password-2', { timeout: 123*1000 });
  await page.waitForSelector('button[type=submit]', { timeout: 60*1000 });

  await page.type('#email-1', cred.username, { delay: 100 });
  await page.type('#password-2', cred.password, { delay: 100 });

  const [ response ] = await Promise.all([
    page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' }),
    page.click('button[type=submit]')
  ]);
  // const navPromise = page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' });
  // await page.click('button[type=submit]');
  // await sleep(500);
  // await saveScreen(page);
  // await navPromise;

  console.log('We are at', await page.evaluate(() => window.location.href));

  if (response) console.log('Logged in :)');
  const currentLocation = await page.evaluate(() => window.location.href);
  console.log('currentLocation', currentLocation);

  // Get cookies
  const cookies = await page.cookies();

  // const store = await Apify.openKeyValueStore('cookies');
  // await store.setValue('kapten1', cookies);
  // console.log('Cookies written to KV store.');

  // add request to search page
  const addRequestInfo = await requestQueue.addRequest({
    url: 'https://app.kapten.com/commander',
    userData: {
      label: 'EXTRACT-KAPTEN',
      cookies
    }
  }, { forefront: true });

  return addRequestInfo;
}

// async function kaptenLogin(requestQueue, page, cred) {
//   const store = await Apify.openKeyValueStore('cookies');
//   const cookies = await store.getValue('kapten1');
//   // console.log('cookies from store:', cookies);
//
//   await requestQueue.addRequest({
//     url: 'https://app.kapten.com/commander',
//     userData: {
//       label: 'EXTRACT-KAPTEN',
//       cookies
//     }
//   }, { forefront: true });
//
//   return true;
// }

async function extractKapten(cookies, coordinates, proxyOptions) {
  console.log('Inside extractKapten function');

  // const store = await Apify.openKeyValueStore('cookies');
  // const cookies2 = await store.getValue('kapten2');

  let cookie = new tough.Cookie(cookies.filter(c => c.name === 'token')[0]);
  let cookiejar = rp.jar();
  cookiejar.setCookie(cookie, 'https://app.kapten.com');

  for (let i = 0; i < coordinates.length; i++) {
    const coords = coordinates[i];
    const fromCoords = coords[0].split(',');
    const toCoords = coords[1].split(',');
    const fromLat = fromCoords[0];
    const fromLng = fromCoords[1];
    const toLat = toCoords[0];
    const toLng = toCoords[1];

    const now = new Date();
    const date = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
    const time = `${now.getHours()}:${now.getMinutes()}`;

    const res = await rp({
      method: 'POST',
      url: 'https://app.kapten.com/api/proxy',
      proxy: proxyOptions.proxyUrl,
      jar: cookiejar,
      headers: {
        'User-Agent': proxyOptions.userAgent
      },
      form: {
        'routine_name': 'ride_price',
        'from[position][latitude]': fromLat,
        'from[position][longitude]': fromLng,
        'appPlatform': 'web',
        'car_type': 'standard',
        'appVersion': 'Mozilla/5.0+(X11;+Ubuntu;+Linux+x86_64;+rv:69.0)+Gecko/20100101+Firefox/69.0',
        'payment[type]': 'cb',
        'payment[_type]': 'cb',
        'payment[ccId]': ''	,
        'payment[clientCode]': '',
        'to[position][latitude]': toLat,
        'to[position][longitude]': toLng,
        'token': cookie.value
      },
      json: true
    });

    const item = {
      source: 'kapten',
      date: date,
      time: time,
      route: coords,
      price: res.res.price,
      arrival: null,
      surge: res.res.booking_fee
    }

    await sleep(1000);

    await Apify.pushData(item);
    console.log('Pushed kapten', time, coords);
  }
}

module.exports = {
  kaptenLogin,
  extractKapten
}
