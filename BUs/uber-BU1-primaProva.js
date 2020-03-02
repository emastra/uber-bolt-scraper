async function doUberLogin(options) {
  const { page, emailSelector, pwSelector, submitBtnSelector, email, pw } = options;

  await page.waitForSelector(emailSelector, { timeout: 61*1000 });
  await page.type(emailSelector, email);
  // let [response] = await Promise.all([
  //   page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' }),
  //   page.click(submitBtnSelector)
  // ]);
  await page.click(submitBtnSelector);
  await page.waitForSelector(pwSelector, { timeout: 123*1000 });

  const currentLocation = await page.evaluate(() => window.location.href);
  console.log('VERIFICATION CURRENT PAGE:', currentLocation);

  await page.type(pwSelector, pw);
  const [response] = await Promise.all([
    page.waitForNavigation({ timeout: 122*1000, waitUntil: 'domcontentloaded' }),
    page.click(submitBtnSelector)
  ]);

  return response;
}

async function uberLogin() {
  const loginRes = await doUberLogin({
    page,
    emailSelector: 'input#useridInput',
    pwSelector: 'input#password',
    submitBtnSelector: 'button.btn.btn--arrow.btn--full',
    email: credentials[site].username,
    pw: credentials[site].password,
  });

  if (loginRes) console.log('Logged in :)');
  const currentLocation = await page.evaluate(() => window.location.href);
  console.log('currentLocation', currentLocation);

  // Get cookies
  const cookies = await page.cookies();

  // add request to search page
  await requestQueue.addRequest({
    url: currentLocation,
    userData: {
      label: 'SEARCH-UBER',
      cookies
    }
  }, { forefront: true });
}

module.exports = {
  uberLogin
}
