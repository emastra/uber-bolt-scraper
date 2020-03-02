const Apify = require('apify');
const rp = require('request-promise-native');
const { sleep } = Apify.utils;
const fs = require('fs');

async function checkAndtriggerCaptcha(page, cred) {
  // helper
  async function getCaptchaDivLength(page) {
    const divLength = await page.evaluate(() => {
      const recaptchaDiv = document.querySelector('div#login-recaptcha');
      return recaptchaDiv.children.length;
    });

    return divLength;
  }

  // actual stuff
  let captchaDivLength = getCaptchaDivLength(page);
  let count = 0;

  while (!captchaDivLength) {
    console.log('While loop iteration count:', ++count);

    await page.reload();
    console.log('refreshed!');

    await page.type('input#useridInput', cred.username, { delay: 100 });
    await sleep(500);

    const res = await Promise.all([
      page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' }),
      page.click('button.btn.btn--arrow.btn--full')
    ]);
    console.log('clicked and navigated!');
    await sleep(500);

    captchaDivLength = getCaptchaDivLength();
  }

  return true;
}

async function uberLogin(requestQueue, page, cred, coordinates) {
  let cookies;
  cookies = await page.cookies();
  // console.log(cookies);

  // step 1: insert username and navigate
  await page.waitForSelector('input#useridInput', { timeout: 61*1000 });
  await page.type('input#useridInput', cred.username, { delay: 30 });
  await sleep(1000);

  await page.setCookie(...cookies);

  const resStep1 = await Promise.all([
    page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' }),
    page.click('button.btn.btn--arrow.btn--full')
  ]);

  // check step1
  if (resStep1) console.log('Step 1 done.');
  let currentLocation = await page.evaluate(() => window.location.href);
  console.log('currentLocation', currentLocation);

  // check if we went straight to password input page
  let jsHandle;
  try {
    await page.waitForSelector('input#password', { timeout: 20*1000 });
    jsHandle = await page.evaluateHandle(() => {
      const element = document.querySelector('input#password');
      return element;
    });
    if (jsHandle) console.log('Password page OK!');
  } catch(err) {
    console.log('No navigation to password page');
  }

  // IF CAPTCHA
  if (!jsHandle) {
    cookies = await page.cookies();
    // console.log(cookies);

    // trigger captcha
    const captchaOnPage = checkAndtriggerCaptcha(page, cred);
    if (captchaOnPage) console.log('reCaptcha is on screen now!');

    // grab siteKey
    const scriptContent = await page.evaluate(() => document.querySelector('#json-globals').innerHTML);
    const j = JSON.parse(scriptContent);
    const siteKey = j.state.config.recaptchaSiteKey;
    console.log('Got the siteKey:', siteKey);

    // Run captcha solving service, and solve
    const input = {
      key: 'ef5b8d879d8b72274358ca9952732b15',
      webUrl: currentLocation,
      siteKey: siteKey
    };

    console.log('Calling captcha solving service for:', currentLocation);
    const run = await Apify.call('petr_cermak~anti-captcha-recaptcha', input).catch(async error => error.run);
    console.log('Service succeeded!');
    console.log('Run status:', run.status);

    const captchaRes = run.output.body;
    console.log('captchaRes', captchaRes);

    await page.evaluate((captchaRes) => {
      const captchaTextArea = document.querySelector('#g-recaptcha-response');
      captchaTextArea.value = captchaRes;
    }, captchaRes);

    await page.setCookie(...cookies);

    const resStep1b = await Promise.all([
      page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' }),
      page.click('button.btn.btn--arrow.btn--full')
    ]);

    if (resStep1b) console.log('Step 1b done.');
    currentLocation = await page.evaluate(() => window.location.href);
    console.log('currentLocation', currentLocation);
  }

  // step 2 - insert password
  cookies = await page.cookies();
  // console.log(cookies);

  await page.waitForSelector('input#password', { timeout: 360*1000 });
  await page.type('input#password', cred.password);
  await sleep(1000);

  await page.setCookie(...cookies);

  const resStep2 = await Promise.all([
    page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' }),
    page.click('button.btn.btn--arrow.btn--full')
  ]);

  if (resStep2) console.log('Step 2 done.');
  currentLocation = await page.evaluate(() => window.location.href);
  console.log('currentLocation', currentLocation);

  // Get cookies and write to file
  cookies = await page.cookies();
  console.log('Got cookies');

  coordinates.reverse();

  for (let i = 0; i < coordinates.length; i++) {
    const coords = coordinates[i];

    const drop = coords[0];
    const pick = coords[1];
    const dropLat = drop.split(',')[0];
    const dropLng = drop.split(',')[1];
    const pickLat = pick.split(',')[0];
    const pickLng = pick.split(',')[1];

    await requestQueue.addRequest({
      url: `https://m.uber.com/looking?drop={"latitude":${dropLat},"longitude":${dropLng}}&pickup={"latitude":${pickLat},"longitude":${pickLng}}`,
      userData: {
        label: 'EXTRACT-UBER',
        cookies,
        coords
      }
    }, { forefront: true });
    // console.log('Added to queue:', coords);
  }

  return true;
}

// async function uberLogin(requestQueue, page, cred, coordinates) {
//   const store = await Apify.openKeyValueStore('cookies');
//   const cookies = await store.getValue('uber2');
//   // const cookies = cred.cookies;
//
//   coordinates.reverse();
//
//   for (let i = 0; i < coordinates.length; i++) {
//     const coords = coordinates[i];
//
//     const drop = coords[0];
//     const pick = coords[1];
//     const dropLat = drop.split(',')[0];
//     const dropLng = drop.split(',')[1];
//     const pickLat = pick.split(',')[0];
//     const pickLng = pick.split(',')[1];
//
//     await requestQueue.addRequest({
//       url: `https://m.uber.com/looking?drop={"latitude":${dropLat},"longitude":${dropLng}}&pickup={"latitude":${pickLat},"longitude":${pickLng}}`,
//       userData: {
//         label: 'EXTRACT-UBER',
//         cookies,
//         coords
//       }
//     }, { forefront: true });
//
//     console.log('Added to queue:', coords);
//   }
//
//   return true;
// }

async function extractUber(page, coords) {
  const responsePromise = page.waitForResponse((res) => {
    return res.url() === 'https://m.uber.com/api/getFareEstimates'
    && res.status() === 200;
  });

  let currentLocation = await page.evaluate(() => window.location.href);
  console.log('currentLocation', currentLocation);

  console.log('Waiting promise...');
  const res = await responsePromise;

  console.log('res status', res.status());
  const jsonData = await res.json();

  const data = jsonData.data;
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
  console.log('Pushed uber:', time, coords);
}

module.exports = {
  uberLogin,
  extractUber
}
