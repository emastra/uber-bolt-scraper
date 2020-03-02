async function doBoltLogin(options) {
  const { page, codeSelector, numSelector, pwSelector, submitBtnSelector, code, num } = options;
  console.log('codeSelector', codeSelector);
  console.log('code', code);

  await page.waitForSelector(codeSelector, { timeout: 61*1000 });
  // await page.type(codeSelector, code);
  // await page.type(numSelector, num);

  // let x = await page.evaluate((codeSelector) => {
  //   const telcodeEl = document.querySelector(codeSelector);
  //   console.log(telcodeEl);
  //   telcodeEl.value = '+39';
  //
  //   return telcodeEl.value;
  // }, codeSelector);
  //
  // console.log('xxxxxx', x);

  let [response] = await Promise.all([
    page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' }),
    page.click(codeSelector)
  ]);

  let currentLocation = await page.evaluate(() => window.location.href);
  console.log('VERIFICATION CURRENT PAGE:', currentLocation);

  await page.waitForSelector(codeSelector, { timeout: 61*1000 });
  // await page.type(codeSelector, code);
  await page.evaluate((data) => {
    const codeInput = document.querySelector(data.codeSelector);
    codeInput.value = data.code;
  }, {code, codeSelector});
  await page.type(numSelector, num);

  [response] = await Promise.all([
    page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' }),
    page.click(submitBtnSelector)
  ]);

  currentLocation = await page.evaluate(() => window.location.href);
  console.log('VERIFICATION CURRENT PAGE:', currentLocation);

  response = await page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' });

  return response;
}

async function boltLogin() {
  // try to get current cookies from kv
  const kvcookies = [
    {
      "name": "_gat",
      "value": "1",
      "domain": ".bolt.eu",
      "path": "/",
      "expires": 1571908796,
      "size": 5,
      "httpOnly": false,
      "secure": false,
      "session": false
    },
    {
      "name": "_gid",
      "value": "GA1.2.840191810.1571908736",
      "domain": ".bolt.eu",
      "path": "/",
      "expires": 1571995136,
      "size": 30,
      "httpOnly": false,
      "secure": false,
      "session": false
    },
    {
      "name": "_ga",
      "value": "GA1.2.201763331.1571908736",
      "domain": ".bolt.eu",
      "path": "/",
      "expires": 1634980736,
      "size": 29,
      "httpOnly": false,
      "secure": false,
      "session": false
    }
  ];

  if (kvcookies) {
    const info = await requestQueue.addRequest({
      url: 'https://m.bolt.eu/Map',
      userData: {
        label: 'SEARCH-BOLT',
        cookies: kvcookies
      }
    }, { forefront: true });
    console.log('kvcookies addreq info', info);
  }
  else {
    console.log('Logging into bolt...');
    const telNumArr = credentials[site].username.split(' ');
    const telCode = telNumArr[0];
    const telNum = telNumArr[1];

    const loginRes = await doBoltLogin({
      page,
      codeSelector: 'input[name=country_code]',
      numSelector: 'input[name=phone_number]',
      pwSelector: 'input#password',
      // submitBtnSelector: 'button.btn.btn--arrow.btn--full',
      submitBtnSelector: 'button[type=submit]',
      code: telCode,
      num: telNum
    });

    if (loginRes) console.log('Logged in :)');
    const currentLocation = await page.evaluate(() => window.location.href);

    // Get cookies
    const cookies = await page.cookies();
    console.log('got cookies');
    console.log('COOKIES!', cookies);

    const store = await Apify.openKeyValueStore('cookie-store');
    await store.setValue('cookie-241019', cookies);
    console.log('written to kv');

    // add request to search page
    const info = await requestQueue.addRequest({
      url: currentLocation,
      userData: {
        label: 'SEARCH-BOLT',
        cookies
      }
    }, { forefront: true });
    console.log('addreq info', info);
  }
}

module.exports = {
  boltLogin
}
